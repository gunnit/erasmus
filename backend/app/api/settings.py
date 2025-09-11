from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional

from app.db.database import get_db
from app.db.models import User
from app.api.dependencies import get_current_user

router = APIRouter()

# Pydantic models for settings
class GeneralSettings(BaseModel):
    organization: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = "en"
    timezone: Optional[str] = "Europe/Brussels"

class NotificationSettings(BaseModel):
    emailNotifications: Optional[bool] = True
    proposalUpdates: Optional[bool] = True
    deadlineReminders: Optional[bool] = True
    partnerRequests: Optional[bool] = False
    newsletter: Optional[bool] = True
    reminderDays: Optional[int] = 7

class SecuritySettings(BaseModel):
    currentPassword: Optional[str] = None
    newPassword: Optional[str] = None
    confirmPassword: Optional[str] = None
    twoFactorEnabled: Optional[bool] = False

class PreferencesSettings(BaseModel):
    theme: Optional[str] = "light"
    defaultCurrency: Optional[str] = "EUR"
    autoSave: Optional[bool] = True
    autoSaveInterval: Optional[int] = 5
    showTips: Optional[bool] = True
    compactView: Optional[bool] = False

class AllSettings(BaseModel):
    general: GeneralSettings
    notifications: NotificationSettings
    security: SecuritySettings
    preferences: PreferencesSettings

# In-memory storage for settings (in production, would use database)
user_settings = {}

@router.get("/", response_model=AllSettings)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> AllSettings:
    """Get all user settings"""
    
    # Get or create default settings for user
    if current_user.id not in user_settings:
        user_settings[current_user.id] = {
            "general": {
                "organization": current_user.organization or "",
                "email": current_user.email,
                "phone": "",
                "address": "",
                "country": "",
                "language": "en",
                "timezone": "Europe/Brussels"
            },
            "notifications": {
                "emailNotifications": True,
                "proposalUpdates": True,
                "deadlineReminders": True,
                "partnerRequests": False,
                "newsletter": True,
                "reminderDays": 7
            },
            "security": {
                "twoFactorEnabled": False
            },
            "preferences": {
                "theme": "light",
                "defaultCurrency": "EUR",
                "autoSave": True,
                "autoSaveInterval": 5,
                "showTips": True,
                "compactView": False
            }
        }
    
    return AllSettings(**user_settings[current_user.id])

@router.put("/general")
async def update_general_settings(
    settings: GeneralSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update general settings"""
    
    if current_user.id not in user_settings:
        user_settings[current_user.id] = {}
    
    user_settings[current_user.id]["general"] = settings.dict(exclude_unset=True)
    
    # Update user model if email or organization changed
    if settings.email and settings.email != current_user.email:
        current_user.email = settings.email
    if settings.organization:
        current_user.organization = settings.organization
    
    db.commit()
    
    return {"message": "General settings updated successfully"}

@router.put("/notifications")
async def update_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update notification settings"""
    
    if current_user.id not in user_settings:
        user_settings[current_user.id] = {}
    
    user_settings[current_user.id]["notifications"] = settings.dict(exclude_unset=True)
    
    return {"message": "Notification settings updated successfully"}

@router.put("/security")
async def update_security_settings(
    settings: SecuritySettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update security settings including password"""
    
    # Validate password change
    if settings.newPassword:
        if not settings.currentPassword:
            raise HTTPException(status_code=400, detail="Current password is required")
        
        if settings.newPassword != settings.confirmPassword:
            raise HTTPException(status_code=400, detail="New passwords do not match")
        
        # In production, would verify current password and hash new password
        # For now, just update the mock storage
    
    if current_user.id not in user_settings:
        user_settings[current_user.id] = {}
    
    # Don't store passwords in settings
    security_data = settings.dict(exclude_unset=True)
    security_data.pop("currentPassword", None)
    security_data.pop("newPassword", None)
    security_data.pop("confirmPassword", None)
    
    user_settings[current_user.id]["security"] = security_data
    
    return {"message": "Security settings updated successfully"}

@router.put("/preferences")
async def update_preferences_settings(
    settings: PreferencesSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update user preferences"""
    
    if current_user.id not in user_settings:
        user_settings[current_user.id] = {}
    
    user_settings[current_user.id]["preferences"] = settings.dict(exclude_unset=True)
    
    return {"message": "Preferences updated successfully"}

@router.post("/reset")
async def reset_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Reset all settings to defaults"""
    
    if current_user.id in user_settings:
        del user_settings[current_user.id]
    
    return {"message": "Settings reset to defaults"}