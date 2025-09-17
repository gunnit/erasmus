"""PayPal payment service for handling subscriptions and one-time payments"""
import httpx
import json
import base64
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging
from app.core.config import settings
from app.db.models import User, Subscription, Payment, SubscriptionPlan, PaymentStatus
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class PayPalService:
    """Service for handling PayPal payments and subscriptions"""

    def __init__(self):
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self.mode = settings.PAYPAL_MODE

        # Set base URL based on mode
        if self.mode == "live":
            self.base_url = "https://api-m.paypal.com"
        else:
            self.base_url = "https://api-m.sandbox.paypal.com"

        # Initialize HTTP client
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_access_token(self) -> str:
        """Get PayPal access token using client credentials"""
        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()

        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        response = await self.client.post(
            f"{self.base_url}/v1/oauth2/token",
            headers=headers,
            data="grant_type=client_credentials"
        )

        if response.status_code != 200:
            logger.error(f"Failed to get PayPal access token: {response.text}")
            raise Exception("Failed to authenticate with PayPal")

        data = response.json()
        return data["access_token"]

    async def create_order(
        self,
        plan_type: SubscriptionPlan,
        user_id: int,
        return_url: str,
        cancel_url: str
    ) -> Dict:
        """Create a PayPal order for subscription payment"""
        access_token = await self.get_access_token()

        # Determine price based on plan
        if plan_type == SubscriptionPlan.STARTER:
            amount = settings.STARTER_PLAN_PRICE
            description = "Erasmus+ AI Assistant - Starter Plan (3 proposals, 30 days)"
        else:
            amount = settings.PROFESSIONAL_PLAN_PRICE
            description = "Erasmus+ AI Assistant - Professional Plan (15 proposals, 90 days)"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": f"subscription_{plan_type.value}_{user_id}",
                "description": description,
                "amount": {
                    "currency_code": "EUR",
                    "value": str(amount)
                }
            }],
            "payment_source": {
                "paypal": {
                    "experience_context": {
                        "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                        "brand_name": "Erasmus+ AI Assistant",
                        "landing_page": "LOGIN",
                        "user_action": "PAY_NOW",
                        "return_url": return_url,
                        "cancel_url": cancel_url
                    }
                }
            }
        }

        response = await self.client.post(
            f"{self.base_url}/v2/checkout/orders",
            headers=headers,
            json=order_data
        )

        if response.status_code != 201:
            logger.error(f"Failed to create PayPal order: {response.text}")
            raise Exception("Failed to create PayPal order")

        order = response.json()

        # Get the approval link for the user
        approval_link = None
        for link in order.get("links", []):
            if link["rel"] == "payer-action":
                approval_link = link["href"]
                break

        return {
            "order_id": order["id"],
            "approval_url": approval_link,
            "status": order["status"]
        }

    async def capture_order(self, order_id: str) -> Dict:
        """Capture payment for an approved PayPal order"""
        access_token = await self.get_access_token()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        response = await self.client.post(
            f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
            headers=headers
        )

        if response.status_code not in [200, 201]:
            logger.error(f"Failed to capture PayPal order: {response.text}")
            raise Exception("Failed to capture PayPal payment")

        return response.json()

    async def process_payment_completion(
        self,
        db: Session,
        order_id: str,
        user_id: int,
        plan_type: SubscriptionPlan
    ) -> Tuple[Subscription, Payment]:
        """Process successful payment and activate subscription"""

        # Capture the PayPal order
        capture_result = await self.capture_order(order_id)

        # Extract payment details
        capture = capture_result["purchase_units"][0]["payments"]["captures"][0]
        payer = capture_result.get("payer", {})

        # Determine plan details
        if plan_type == SubscriptionPlan.STARTER:
            proposals_limit = settings.STARTER_PLAN_PROPOSALS
            days_valid = settings.STARTER_PLAN_DAYS
            amount = settings.STARTER_PLAN_PRICE
        else:
            proposals_limit = settings.PROFESSIONAL_PLAN_PROPOSALS
            days_valid = settings.PROFESSIONAL_PLAN_DAYS
            amount = settings.PROFESSIONAL_PLAN_PRICE

        # Create or update subscription
        subscription = db.query(Subscription).filter_by(user_id=user_id).first()

        if subscription:
            # Update existing subscription
            subscription.plan_type = plan_type
            subscription.proposals_limit = proposals_limit
            subscription.proposals_used = 0  # Reset counter
            subscription.amount_paid = amount
            subscription.started_at = datetime.utcnow()
            subscription.expires_at = datetime.utcnow() + timedelta(days=days_valid)
            subscription.is_active = True
            subscription.updated_at = datetime.utcnow()
        else:
            # Create new subscription
            subscription = Subscription(
                user_id=user_id,
                plan_type=plan_type,
                proposals_limit=proposals_limit,
                proposals_used=0,
                amount_paid=amount,
                currency="EUR",
                started_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=days_valid),
                is_active=True
            )
            db.add(subscription)

        # Update user subscription fields
        user = db.query(User).filter_by(id=user_id).first()
        if user:
            user.subscription_plan = plan_type
            user.proposals_remaining = proposals_limit
            user.subscription_expires_at = subscription.expires_at
            user.subscription_started_at = subscription.started_at

        # Flush to get subscription ID
        db.flush()

        # Create payment record
        payment = Payment(
            user_id=user_id,
            subscription_id=subscription.id,
            amount=amount,
            currency="EUR",
            status=PaymentStatus.COMPLETED,
            paypal_order_id=order_id,
            paypal_capture_id=capture["id"],
            paypal_payer_id=payer.get("payer_id"),
            paypal_payer_email=payer.get("email_address"),
            payment_method="paypal",
            description=f"{plan_type.value.capitalize()} Plan Subscription",
            metadata={
                "plan_type": plan_type.value,
                "proposals_limit": proposals_limit,
                "days_valid": days_valid
            },
            completed_at=datetime.utcnow()
        )
        db.add(payment)

        # Commit all changes
        db.commit()

        return subscription, payment

    async def get_order_details(self, order_id: str) -> Dict:
        """Get details of a PayPal order"""
        access_token = await self.get_access_token()

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        response = await self.client.get(
            f"{self.base_url}/v2/checkout/orders/{order_id}",
            headers=headers
        )

        if response.status_code != 200:
            logger.error(f"Failed to get PayPal order details: {response.text}")
            raise Exception("Failed to get order details")

        return response.json()

    async def refund_payment(self, capture_id: str, amount: Optional[float] = None) -> Dict:
        """Refund a captured payment"""
        access_token = await self.get_access_token()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        refund_data = {}
        if amount:
            refund_data = {
                "amount": {
                    "value": str(amount),
                    "currency_code": "EUR"
                }
            }

        response = await self.client.post(
            f"{self.base_url}/v2/payments/captures/{capture_id}/refund",
            headers=headers,
            json=refund_data if refund_data else None
        )

        if response.status_code != 201:
            logger.error(f"Failed to refund PayPal payment: {response.text}")
            raise Exception("Failed to refund payment")

        return response.json()

    async def check_subscription_validity(self, db: Session, user_id: int) -> bool:
        """Check if user has an active subscription"""
        subscription = db.query(Subscription).filter_by(
            user_id=user_id,
            is_active=True
        ).first()

        if not subscription:
            return False

        # Check if subscription is expired
        if subscription.expires_at < datetime.utcnow():
            subscription.is_active = False
            db.commit()
            return False

        # Check if proposals limit is reached
        if subscription.proposals_used >= subscription.proposals_limit:
            return False

        return True

    async def use_proposal_credit(self, db: Session, user_id: int) -> bool:
        """Decrement proposal credit when a proposal is generated"""
        subscription = db.query(Subscription).filter_by(
            user_id=user_id,
            is_active=True
        ).first()

        if not subscription:
            return False

        if subscription.proposals_used >= subscription.proposals_limit:
            return False

        if subscription.expires_at < datetime.utcnow():
            subscription.is_active = False
            db.commit()
            return False

        # Increment proposals used
        subscription.proposals_used += 1

        # Update user's remaining proposals
        user = db.query(User).filter_by(id=user_id).first()
        if user:
            user.proposals_remaining = subscription.proposals_limit - subscription.proposals_used

        db.commit()
        return True

    async def get_user_subscription_status(self, db: Session, user_id: int) -> Dict:
        """Get detailed subscription status for a user"""
        subscription = db.query(Subscription).filter_by(
            user_id=user_id,
            is_active=True
        ).first()

        if not subscription:
            return {
                "has_subscription": False,
                "plan_type": None,
                "proposals_remaining": 0,
                "expires_at": None
            }

        # Check if expired
        if subscription.expires_at < datetime.utcnow():
            subscription.is_active = False
            db.commit()
            return {
                "has_subscription": False,
                "plan_type": subscription.plan_type.value,
                "proposals_remaining": 0,
                "expires_at": subscription.expires_at,
                "expired": True
            }

        proposals_remaining = subscription.proposals_limit - subscription.proposals_used
        days_remaining = (subscription.expires_at - datetime.utcnow()).days

        return {
            "has_subscription": True,
            "plan_type": subscription.plan_type.value,
            "proposals_remaining": proposals_remaining,
            "proposals_limit": subscription.proposals_limit,
            "proposals_used": subscription.proposals_used,
            "expires_at": subscription.expires_at,
            "days_remaining": days_remaining,
            "is_active": subscription.is_active
        }

    async def __aenter__(self):
        """Async context manager entry"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - close HTTP client"""
        await self.client.aclose()