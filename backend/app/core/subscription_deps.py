"""Dependency for checking subscription validity before generation"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.auth import get_current_user
from app.db.models import User
from app.services.paypal_service import PayPalService
import logging

logger = logging.getLogger(__name__)

async def require_valid_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to check if user has a valid subscription
    Raises HTTPException if subscription is invalid
    """
    try:
        async with PayPalService() as paypal:
            # Check subscription validity
            is_valid = await paypal.check_subscription_validity(db, current_user.id)

            if not is_valid:
                # Get detailed status to provide better error message
                subscription_status = await paypal.get_user_subscription_status(db, current_user.id)

                if not subscription_status["has_subscription"]:
                    detail = "No active subscription. Please purchase a plan to generate proposals."
                elif subscription_status.get("expired"):
                    detail = "Your subscription has expired. Please renew to continue generating proposals."
                elif subscription_status.get("proposals_remaining", 0) <= 0:
                    detail = f"You have reached your proposal limit ({subscription_status.get('proposals_limit', 0)} proposals). Please upgrade your plan for more proposals."
                else:
                    detail = "Your subscription is not valid. Please check your subscription status."

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=detail,
                    headers={
                        "X-Subscription-Required": "true",
                        "X-Subscription-Status": "invalid"
                    }
                )

        return current_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking subscription: {str(e)}")
        # In case of error, allow generation to proceed (fail open)
        # You may want to change this to fail closed for production
        logger.warning(f"Subscription check failed for user {current_user.id}, allowing generation")
        return current_user

async def use_proposal_credit(
    current_user: User,
    db: Session
) -> bool:
    """
    Use one proposal credit after successful generation
    Returns True if credit was used, False otherwise
    """
    try:
        async with PayPalService() as paypal:
            success = await paypal.use_proposal_credit(db, current_user.id)
            if success:
                logger.info(f"Used 1 proposal credit for user {current_user.id}")
            else:
                logger.warning(f"Failed to use proposal credit for user {current_user.id}")
            return success
    except Exception as e:
        logger.error(f"Error using proposal credit: {str(e)}")
        return False