from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional

from app.db.database import get_db
from app.db.models import User
from app.api.dependencies import get_current_user
from app.core.auth import verify_password, get_password_hash

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

# Default settings template
_DEFAULT_SETTINGS = {
    "notifications": {
        "emailNotifications": True,
        "proposalUpdates": True,
        "deadlineReminders": True,
        "partnerRequests": False,
        "newsletter": True,
        "reminderDays": 7
    },
    "preferences": {
        "theme": "light",
        "defaultCurrency": "EUR",
        "autoSave": True,
        "autoSaveInterval": 5,
        "showTips": True,
        "compactView": False
    },
    "security": {
        "twoFactorEnabled": False
    }
}


def _get_settings(user: User) -> dict:
    """Load settings from the User model's settings_json column."""
    stored = user.settings_json or {}
    return {
        "general": {
            "organization": user.organization or "",
            "email": user.email,
            "phone": user.phone or "",
            "address": stored.get("general", {}).get("address", ""),
            "country": user.country or "",
            "language": stored.get("general", {}).get("language", "en"),
            "timezone": stored.get("general", {}).get("timezone", "Europe/Brussels")
        },
        "notifications": {
            **_DEFAULT_SETTINGS["notifications"],
            **stored.get("notifications", {})
        },
        "security": {
            **_DEFAULT_SETTINGS["security"],
            **stored.get("security", {})
        },
        "preferences": {
            **_DEFAULT_SETTINGS["preferences"],
            **stored.get("preferences", {})
        }
    }


def _update_settings_section(user: User, section: str, data: dict, db: Session):
    """Update a specific section in the settings_json column."""
    stored = user.settings_json or {}
    stored[section] = data
    user.settings_json = stored
    db.commit()


@router.get("/", response_model=AllSettings)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> AllSettings:
    """Get all user settings"""
    return AllSettings(**_get_settings(current_user))

@router.put("/general")
async def update_general_settings(
    settings: GeneralSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update general settings"""

    # Update direct User columns
    if settings.email and settings.email != current_user.email:
        current_user.email = settings.email
    if settings.organization:
        current_user.organization = settings.organization
    if settings.phone is not None:
        current_user.phone = settings.phone
    if settings.country is not None:
        current_user.country = settings.country

    # Store remaining general settings in JSON
    general_data = {
        "address": settings.address or "",
        "language": settings.language or "en",
        "timezone": settings.timezone or "Europe/Brussels"
    }
    _update_settings_section(current_user, "general", general_data, db)

    return {"message": "General settings updated successfully"}

@router.put("/notifications")
async def update_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update notification settings"""
    _update_settings_section(current_user, "notifications", settings.dict(exclude_unset=True), db)
    return {"message": "Notification settings updated successfully"}

@router.put("/security")
async def update_security_settings(
    settings: SecuritySettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update security settings including password"""

    # Handle password change
    if settings.newPassword:
        if not settings.currentPassword:
            raise HTTPException(status_code=400, detail="Current password is required")

        if settings.newPassword != settings.confirmPassword:
            raise HTTPException(status_code=400, detail="New passwords do not match")

        # Verify current password
        if not verify_password(settings.currentPassword, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Hash and save new password
        current_user.hashed_password = get_password_hash(settings.newPassword)

    # Store non-password security settings
    security_data = {"twoFactorEnabled": settings.twoFactorEnabled or False}
    _update_settings_section(current_user, "security", security_data, db)

    return {"message": "Security settings updated successfully"}

@router.put("/preferences")
async def update_preferences_settings(
    settings: PreferencesSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update user preferences"""
    _update_settings_section(current_user, "preferences", settings.dict(exclude_unset=True), db)
    return {"message": "Preferences updated successfully"}

@router.post("/reset")
async def reset_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Reset all settings to defaults"""
    current_user.settings_json = {}
    db.commit()
    return {"message": "Settings reset to defaults"}
