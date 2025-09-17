"""Payment API endpoints for handling PayPal subscriptions"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.core.auth import get_current_user
from app.db.models import User, SubscriptionPlan
from app.services.paypal_service import PayPalService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

class CreateOrderRequest(BaseModel):
    plan_type: str  # "starter" or "professional"
    return_url: str
    cancel_url: str

class CaptureOrderRequest(BaseModel):
    order_id: str

class SubscriptionStatusResponse(BaseModel):
    has_subscription: bool
    plan_type: Optional[str]
    proposals_remaining: int
    proposals_limit: Optional[int]
    expires_at: Optional[str]
    days_remaining: Optional[int]
    is_active: bool = False

class PricingPlansResponse(BaseModel):
    starter: Dict
    professional: Dict

@router.get("/pricing-plans", response_model=PricingPlansResponse)
async def get_pricing_plans():
    """Get available subscription plans and their details"""
    from app.core.config import settings

    return {
        "starter": {
            "name": "Starter",
            "price": settings.STARTER_PLAN_PRICE,
            "currency": "EUR",
            "proposals": settings.STARTER_PLAN_PROPOSALS,
            "days": settings.STARTER_PLAN_DAYS,
            "features": [
                f"{settings.STARTER_PLAN_PROPOSALS} complete proposals",
                "All 27 questions generated",
                "PDF export included",
                f"{settings.STARTER_PLAN_DAYS}-day access",
                "Quality scoring & feedback",
                "Perfect for individual applicants"
            ]
        },
        "professional": {
            "name": "Professional",
            "price": settings.PROFESSIONAL_PLAN_PRICE,
            "currency": "EUR",
            "proposals": settings.PROFESSIONAL_PLAN_PROPOSALS,
            "days": settings.PROFESSIONAL_PLAN_DAYS,
            "features": [
                f"{settings.PROFESSIONAL_PLAN_PROPOSALS} complete proposals",
                "Priority generation (faster queue)",
                "Workplan builder included",
                f"{settings.PROFESSIONAL_PLAN_DAYS}-day access",
                "Export to multiple formats",
                "API access for integration",
                "Perfect for consultants/organizations"
            ]
        }
    }

@router.post("/create-order")
async def create_order(
    request: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a PayPal order for subscription payment"""
    try:
        # Validate plan type
        if request.plan_type not in ["starter", "professional"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid plan type. Must be 'starter' or 'professional'"
            )

        # Map string to enum
        plan_type = SubscriptionPlan.STARTER if request.plan_type == "starter" else SubscriptionPlan.PROFESSIONAL

        # Create PayPal order
        async with PayPalService() as paypal:
            order_result = await paypal.create_order(
                plan_type=plan_type,
                user_id=current_user.id,
                return_url=request.return_url,
                cancel_url=request.cancel_url
            )

        return {
            "order_id": order_result["order_id"],
            "approval_url": order_result["approval_url"],
            "status": order_result["status"]
        }

    except Exception as e:
        logger.error(f"Error creating PayPal order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order"
        )

@router.post("/capture-order")
async def capture_order(
    request: CaptureOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Capture payment for an approved PayPal order"""
    try:
        async with PayPalService() as paypal:
            # First get order details to determine plan type
            order_details = await paypal.get_order_details(request.order_id)

            # Extract plan type from reference ID
            reference_id = order_details["purchase_units"][0]["reference_id"]
            plan_type_str = reference_id.split("_")[1]
            plan_type = SubscriptionPlan.STARTER if plan_type_str == "starter" else SubscriptionPlan.PROFESSIONAL

            # Process the payment and activate subscription
            subscription, payment = await paypal.process_payment_completion(
                db=db,
                order_id=request.order_id,
                user_id=current_user.id,
                plan_type=plan_type
            )

        return {
            "success": True,
            "subscription": {
                "plan_type": subscription.plan_type.value,
                "proposals_limit": subscription.proposals_limit,
                "expires_at": subscription.expires_at.isoformat(),
                "is_active": subscription.is_active
            },
            "payment": {
                "payment_id": payment.id,
                "amount": float(payment.amount),
                "status": payment.status.value,
                "completed_at": payment.completed_at.isoformat()
            }
        }

    except Exception as e:
        logger.error(f"Error capturing PayPal order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process payment"
        )

@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status for the user"""
    try:
        async with PayPalService() as paypal:
            status = await paypal.get_user_subscription_status(db, current_user.id)

        return SubscriptionStatusResponse(
            has_subscription=status["has_subscription"],
            plan_type=status.get("plan_type"),
            proposals_remaining=status.get("proposals_remaining", 0),
            proposals_limit=status.get("proposals_limit"),
            expires_at=status["expires_at"].isoformat() if status.get("expires_at") else None,
            days_remaining=status.get("days_remaining"),
            is_active=status.get("is_active", False)
        )

    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}")
        return SubscriptionStatusResponse(
            has_subscription=False,
            plan_type=None,
            proposals_remaining=0,
            proposals_limit=None,
            expires_at=None,
            days_remaining=None,
            is_active=False
        )

@router.post("/check-subscription")
async def check_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has valid subscription before allowing generation"""
    try:
        async with PayPalService() as paypal:
            is_valid = await paypal.check_subscription_validity(db, current_user.id)

        if not is_valid:
            subscription_status = await paypal.get_user_subscription_status(db, current_user.id)

            if not subscription_status["has_subscription"]:
                detail = "No active subscription. Please purchase a plan to continue."
            elif subscription_status.get("expired"):
                detail = "Your subscription has expired. Please renew to continue."
            else:
                detail = "You have reached your proposal limit. Please upgrade your plan."

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=detail,
                headers={"X-Subscription-Required": "true"}
            )

        return {
            "valid": True,
            "message": "Subscription is valid"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check subscription status"
        )

@router.get("/payment-history")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's payment history"""
    from app.db.models import Payment

    payments = db.query(Payment).filter_by(
        user_id=current_user.id
    ).order_by(Payment.created_at.desc()).all()

    return {
        "payments": [
            {
                "id": payment.id,
                "amount": float(payment.amount),
                "currency": payment.currency,
                "status": payment.status.value,
                "description": payment.description,
                "created_at": payment.created_at.isoformat(),
                "completed_at": payment.completed_at.isoformat() if payment.completed_at else None
            }
            for payment in payments
        ]
    }