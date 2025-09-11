from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Proposal
from app.api.dependencies import get_current_user
from app.schemas.user import UserUpdate
from app.core.auth import get_password_hash
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/profile", tags=["profile"])

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    bio: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    proposal_count = db.query(Proposal).filter(Proposal.user_id == current_user.id).count()
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "organization": current_user.organization,
        "phone": getattr(current_user, 'phone', ''),
        "country": getattr(current_user, 'country', ''),
        "bio": getattr(current_user, 'bio', ''),
        "created_at": current_user.created_at,
        "proposal_count": proposal_count,
        "is_active": current_user.is_active
    }

@router.put("/")
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    update_data = profile_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "organization": current_user.organization
        }
    }

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    from app.core.auth import verify_password
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.delete("/")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account and all associated data"""
    # Delete all user's proposals first
    db.query(Proposal).filter(Proposal.user_id == current_user.id).delete()
    
    # Delete the user
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"}