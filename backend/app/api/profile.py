from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional, List
import base64

from app.db.database import get_db
from app.db.models import User, Proposal, Partner
from app.api.dependencies import get_current_user

router = APIRouter()

# Pydantic models for profile
class PersonalInfo(BaseModel):
    fullName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None  # Base64 encoded image

class OrganizationInfo(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = "NGO"
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

class ExpertiseInfo(BaseModel):
    areas: Optional[List[str]] = []
    languages: Optional[List[str]] = []
    experience: Optional[str] = None
    certifications: Optional[List[str]] = []

class SocialLinks(BaseModel):
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    orcid: Optional[str] = None

class ProfileStats(BaseModel):
    proposalsCreated: int = 0
    proposalsApproved: int = 0
    totalFunding: float = 0
    partnersConnected: int = 0
    successRate: float = 0
    profileCompletion: int = 0

class UserProfile(BaseModel):
    personalInfo: PersonalInfo
    organization: OrganizationInfo
    expertise: ExpertiseInfo
    social: SocialLinks
    stats: ProfileStats


def _load_profile_from_db(user: User) -> dict:
    """Load profile data from the User model fields and profile_data JSON column."""
    profile_data = user.profile_data or {}

    return {
        "personalInfo": {
            "fullName": user.full_name or "",
            "email": user.email,
            "phone": user.phone or "",
            "title": profile_data.get("title", ""),
            "bio": user.bio or "",
            "avatar": user.avatar_url
        },
        "organization": {
            "name": user.organization or "",
            "type": profile_data.get("org_type", "NGO"),
            "address": profile_data.get("org_address", ""),
            "city": profile_data.get("org_city", ""),
            "country": user.country or "",
            "website": profile_data.get("org_website", ""),
            "description": profile_data.get("org_description", "")
        },
        "expertise": {
            "areas": profile_data.get("expertise_areas", []),
            "languages": profile_data.get("languages", []),
            "experience": profile_data.get("experience", ""),
            "certifications": profile_data.get("certifications", [])
        },
        "social": {
            "linkedin": profile_data.get("linkedin", ""),
            "twitter": profile_data.get("twitter", ""),
            "orcid": profile_data.get("orcid", "")
        }
    }


def _save_profile_to_db(user: User, profile_dict: dict, db: Session):
    """Save profile data to User model fields and profile_data JSON column."""
    personal = profile_dict.get("personalInfo", {})
    org = profile_dict.get("organization", {})
    expertise = profile_dict.get("expertise", {})
    social = profile_dict.get("social", {})

    # Update direct columns
    if personal.get("fullName"):
        user.full_name = personal["fullName"]
    if personal.get("email") and personal["email"] != user.email:
        user.email = personal["email"]
    if personal.get("phone") is not None:
        user.phone = personal["phone"]
    if personal.get("bio") is not None:
        user.bio = personal["bio"]
    if org.get("name"):
        user.organization = org["name"]
    if org.get("country") is not None:
        user.country = org["country"]

    # Update JSON profile_data column
    profile_data = user.profile_data or {}
    profile_data.update({
        "title": personal.get("title", profile_data.get("title", "")),
        "org_type": org.get("type", profile_data.get("org_type", "NGO")),
        "org_address": org.get("address", profile_data.get("org_address", "")),
        "org_city": org.get("city", profile_data.get("org_city", "")),
        "org_website": org.get("website", profile_data.get("org_website", "")),
        "org_description": org.get("description", profile_data.get("org_description", "")),
        "expertise_areas": expertise.get("areas", profile_data.get("expertise_areas", [])),
        "languages": expertise.get("languages", profile_data.get("languages", [])),
        "experience": expertise.get("experience", profile_data.get("experience", "")),
        "certifications": expertise.get("certifications", profile_data.get("certifications", [])),
        "linkedin": social.get("linkedin", profile_data.get("linkedin", "")),
        "twitter": social.get("twitter", profile_data.get("twitter", "")),
        "orcid": social.get("orcid", profile_data.get("orcid", "")),
    })
    user.profile_data = profile_data

    db.commit()


def calculate_profile_completion(profile: Dict[str, Any]) -> int:
    """Calculate profile completion percentage"""
    total_fields = 0
    filled_fields = 0

    # Check personal info
    personal_fields = ["fullName", "email", "phone", "title", "bio"]
    for field in personal_fields:
        total_fields += 1
        if profile.get("personalInfo", {}).get(field):
            filled_fields += 1

    # Check organization info
    org_fields = ["name", "type", "city", "country", "description"]
    for field in org_fields:
        total_fields += 1
        if profile.get("organization", {}).get(field):
            filled_fields += 1

    # Check expertise
    total_fields += 3
    if profile.get("expertise", {}).get("areas"):
        filled_fields += 1
    if profile.get("expertise", {}).get("languages"):
        filled_fields += 1
    if profile.get("expertise", {}).get("experience"):
        filled_fields += 1

    # Check social links
    social_fields = ["linkedin", "twitter", "orcid"]
    for field in social_fields:
        total_fields += 1
        if profile.get("social", {}).get(field):
            filled_fields += 1

    return int((filled_fields / total_fields) * 100) if total_fields > 0 else 0

@router.get("/", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserProfile:
    """Get user profile"""

    # Get proposals for stats
    proposals = db.query(Proposal).filter(Proposal.user_id == current_user.id).all()
    total_proposals = len(proposals)
    approved_proposals = len([p for p in proposals if p.status == "approved"])

    # Parse budget safely (budget is a String column)
    total_funding = 0
    for p in proposals:
        try:
            total_funding += float(str(p.budget or "0").replace(",", "").replace("\u20ac", ""))
        except (ValueError, AttributeError):
            pass

    # Count partners from partner library
    partners_count = db.query(Partner).filter(Partner.user_id == current_user.id).count()

    success_rate = (approved_proposals / total_proposals * 100) if total_proposals > 0 else 0

    # Load profile from DB
    profile = _load_profile_from_db(current_user)

    # Calculate stats
    profile["stats"] = {
        "proposalsCreated": total_proposals,
        "proposalsApproved": approved_proposals,
        "totalFunding": total_funding,
        "partnersConnected": partners_count,
        "successRate": round(success_rate, 1),
        "profileCompletion": calculate_profile_completion(profile)
    }

    return UserProfile(**profile)

@router.put("/")
async def update_profile(
    profile_update: UserProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Update user profile"""

    profile_dict = profile_update.dict(exclude={"stats"})
    _save_profile_to_db(current_user, profile_dict, db)

    return {"message": "Profile updated successfully"}

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Upload profile avatar"""

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read and encode file
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode()

    # Store avatar in DB
    current_user.avatar_url = f"data:{file.content_type};base64,{base64_image}"
    db.commit()

    return {"message": "Avatar uploaded successfully"}

@router.get("/completion-tips")
async def get_completion_tips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, str]]:
    """Get tips for completing profile"""

    tips = []
    profile = _load_profile_from_db(current_user)

    # Check missing fields and provide tips
    if not profile.get("personalInfo", {}).get("bio"):
        tips.append({
            "section": "bio",
            "tip": "Add a professional bio to help partners understand your expertise"
        })

    if not profile.get("expertise", {}).get("areas"):
        tips.append({
            "section": "expertise",
            "tip": "Select your areas of expertise to match with relevant opportunities"
        })

    if not profile.get("expertise", {}).get("languages"):
        tips.append({
            "section": "languages",
            "tip": "Add languages you speak to connect with international partners"
        })

    if not profile.get("social", {}).get("linkedin"):
        tips.append({
            "section": "social",
            "tip": "Add your LinkedIn profile to build professional credibility"
        })

    if not profile.get("organization", {}).get("description"):
        tips.append({
            "section": "organization",
            "tip": "Describe your organization to attract suitable partners"
        })

    if not tips:
        tips.append({
            "section": "profile",
            "tip": "Your profile is looking great! Keep it up to date."
        })

    return tips

@router.get("/badges")
async def get_user_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get user achievement badges"""

    proposals = db.query(Proposal).filter(Proposal.user_id == current_user.id).all()
    badges = []

    # First proposal badge
    if len(proposals) >= 1:
        badges.append({
            "id": "first_proposal",
            "name": "First Steps",
            "description": "Created your first proposal",
            "icon": "rocket",
            "earned": True
        })

    # 10 proposals badge
    if len(proposals) >= 10:
        badges.append({
            "id": "ten_proposals",
            "name": "Prolific Creator",
            "description": "Created 10 proposals",
            "icon": "star",
            "earned": True
        })

    # High success rate badge
    approved = len([p for p in proposals if p.status == "approved"])
    if len(proposals) > 0 and (approved / len(proposals)) >= 0.75:
        badges.append({
            "id": "high_success",
            "name": "Success Master",
            "description": "75% or higher approval rate",
            "icon": "trophy",
            "earned": True
        })

    # Million euro badge - parse budget safely
    total_funding = 0
    for p in proposals:
        if p.status == "approved":
            try:
                total_funding += float(str(p.budget or "0").replace(",", "").replace("\u20ac", ""))
            except (ValueError, AttributeError):
                pass

    if total_funding >= 1000000:
        badges.append({
            "id": "million_euro",
            "name": "Million Euro Club",
            "description": "Secured over 1M EUR in funding",
            "icon": "euro",
            "earned": True
        })

    return badges
