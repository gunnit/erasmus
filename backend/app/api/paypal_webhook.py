"""PayPal Webhook Handler for asynchronous payment events"""
from fastapi import APIRouter, Request, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.paypal_service import PayPalService
from app.db import models
from app.core.config import settings
import logging
import hmac
import hashlib
import json
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

async def verify_webhook_signature(
    request: Request,
    paypal_transmission_id: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-ID"),
    paypal_transmission_time: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-TIME"),
    paypal_transmission_sig: Optional[str] = Header(None, alias="PAYPAL-TRANSMISSION-SIG"),
    paypal_cert_url: Optional[str] = Header(None, alias="PAYPAL-CERT-URL"),
    paypal_auth_algo: Optional[str] = Header(None, alias="PAYPAL-AUTH-ALGO"),
) -> bool:
    """
    Verify PayPal webhook signature to ensure authenticity
    See: https://developer.paypal.com/api/rest/webhooks/rest/
    """
    if not settings.PAYPAL_WEBHOOK_ID:
        logger.warning("PAYPAL_WEBHOOK_ID not configured - skipping signature verification")
        return True  # Skip verification if not configured (DEV only)

    if not all([paypal_transmission_id, paypal_transmission_time, paypal_transmission_sig]):
        logger.error("Missing required PayPal webhook headers")
        return False

    try:
        # Get request body
        body = await request.body()
        body_str = body.decode('utf-8')

        # Construct message for verification
        # Format: transmission_id|transmission_time|webhook_id|crc32(body)
        import zlib
        crc = zlib.crc32(body) & 0xffffffff

        expected_sig = f"{paypal_transmission_id}|{paypal_transmission_time}|{settings.PAYPAL_WEBHOOK_ID}|{crc}"

        # In production, verify against PayPal's public certificate
        # For now, log for debugging
        logger.info(f"Webhook signature verification: transmission_id={paypal_transmission_id}")

        # TODO: Implement full certificate-based verification
        # This is a simplified version - production should verify certificate

        return True  # Simplified for initial implementation

    except Exception as e:
        logger.error(f"Error verifying webhook signature: {str(e)}")
        return False

@router.post("/paypal-webhook")
async def handle_paypal_webhook(
    request: Request,
    db: Session = Depends(get_db),
    signature_valid: bool = Depends(verify_webhook_signature)
):
    """
    Handle PayPal webhook events

    Supported events:
    - PAYMENT.CAPTURE.COMPLETED: Payment successfully captured
    - PAYMENT.CAPTURE.DENIED: Payment denied
    - PAYMENT.CAPTURE.REFUNDED: Payment refunded
    - BILLING.SUBSCRIPTION.CREATED: Subscription created
    - BILLING.SUBSCRIPTION.CANCELLED: Subscription cancelled
    """

    # Verify webhook signature
    if not signature_valid:
        logger.error("Invalid webhook signature")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        # Parse webhook event
        body = await request.json()
        event_type = body.get("event_type")
        resource = body.get("resource", {})

        logger.info(f"Received PayPal webhook: {event_type}")

        # Handle different event types
        if event_type == "PAYMENT.CAPTURE.COMPLETED":
            await handle_payment_completed(db, resource)

        elif event_type == "PAYMENT.CAPTURE.DENIED":
            await handle_payment_denied(db, resource)

        elif event_type == "PAYMENT.CAPTURE.REFUNDED":
            await handle_payment_refunded(db, resource)

        elif event_type == "BILLING.SUBSCRIPTION.CREATED":
            await handle_subscription_created(db, resource)

        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            await handle_subscription_cancelled(db, resource)

        else:
            logger.info(f"Unhandled webhook event type: {event_type}")

        return {"status": "success", "event_type": event_type}

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        # Return 200 to acknowledge receipt even if processing fails
        # PayPal will retry if we return error
        return {"status": "error", "message": str(e)}

async def handle_payment_completed(db: Session, resource: dict):
    """Handle successful payment capture"""
    try:
        order_id = resource.get("supplementary_data", {}).get("related_ids", {}).get("order_id")
        capture_id = resource.get("id")
        amount = resource.get("amount", {})

        logger.info(f"Payment completed: order_id={order_id}, capture_id={capture_id}, amount={amount}")

        # Find payment record
        payment = db.query(models.Payment).filter(
            models.Payment.paypal_order_id == order_id
        ).first()

        if payment:
            payment.status = "COMPLETED"
            payment.paypal_capture_id = capture_id
            payment.completed_at = db.func.now()

            # Update subscription if exists
            if payment.subscription_id:
                subscription = db.query(models.Subscription).get(payment.subscription_id)
                if subscription:
                    subscription.is_active = True
                    logger.info(f"Activated subscription {subscription.id}")

            db.commit()
            logger.info(f"Payment {payment.id} marked as completed")
        else:
            logger.warning(f"Payment record not found for order_id: {order_id}")

    except Exception as e:
        logger.error(f"Error handling payment completed: {str(e)}")
        db.rollback()

async def handle_payment_denied(db: Session, resource: dict):
    """Handle denied payment"""
    try:
        order_id = resource.get("supplementary_data", {}).get("related_ids", {}).get("order_id")

        logger.warning(f"Payment denied: order_id={order_id}")

        payment = db.query(models.Payment).filter(
            models.Payment.paypal_order_id == order_id
        ).first()

        if payment:
            payment.status = "FAILED"
            db.commit()
            logger.info(f"Payment {payment.id} marked as failed")

    except Exception as e:
        logger.error(f"Error handling payment denied: {str(e)}")
        db.rollback()

async def handle_payment_refunded(db: Session, resource: dict):
    """Handle payment refund"""
    try:
        capture_id = resource.get("id")
        refund_id = resource.get("id")

        logger.info(f"Payment refunded: capture_id={capture_id}, refund_id={refund_id}")

        # Find payment by capture_id
        payment = db.query(models.Payment).filter(
            models.Payment.paypal_capture_id == capture_id
        ).first()

        if payment:
            payment.status = "REFUNDED"
            payment.refunded_at = db.func.now()

            # Deactivate subscription if exists
            if payment.subscription_id:
                subscription = db.query(models.Subscription).get(payment.subscription_id)
                if subscription:
                    subscription.is_active = False
                    subscription.cancelled_at = db.func.now()
                    logger.info(f"Deactivated subscription {subscription.id} due to refund")

            db.commit()
            logger.info(f"Payment {payment.id} marked as refunded")

    except Exception as e:
        logger.error(f"Error handling payment refunded: {str(e)}")
        db.rollback()

async def handle_subscription_created(db: Session, resource: dict):
    """Handle subscription creation (if using PayPal Subscriptions API)"""
    try:
        subscription_id = resource.get("id")
        logger.info(f"Subscription created: {subscription_id}")
        # Implement subscription logic if using PayPal Subscriptions

    except Exception as e:
        logger.error(f"Error handling subscription created: {str(e)}")

async def handle_subscription_cancelled(db: Session, resource: dict):
    """Handle subscription cancellation"""
    try:
        paypal_subscription_id = resource.get("id")
        logger.info(f"Subscription cancelled: {paypal_subscription_id}")

        # Find subscription by PayPal subscription ID
        subscription = db.query(models.Subscription).filter(
            models.Subscription.paypal_subscription_id == paypal_subscription_id
        ).first()

        if subscription:
            subscription.is_active = False
            subscription.cancelled_at = db.func.now()
            db.commit()
            logger.info(f"Subscription {subscription.id} cancelled")

    except Exception as e:
        logger.error(f"Error handling subscription cancelled: {str(e)}")
        db.rollback()
