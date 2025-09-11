from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional, List
import base64

from app.db.database import get_db
from app.db.models import User, Proposal
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

# In-memory storage for profiles (in production, would use database)
user_profiles = {}

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
    total_funding = sum(p.budget or 0 for p in proposals)
    
    # Count unique partners
    all_partners = []
    for p in proposals:
        if p.partners:
            all_partners.extend(p.partners if isinstance(p.partners, list) else [])
    partners_count = len(set(all_partners))
    
    success_rate = (approved_proposals / total_proposals * 100) if total_proposals > 0 else 0
    
    # Get or create profile
    if current_user.id not in user_profiles:
        user_profiles[current_user.id] = {
            "personalInfo": {
                "fullName": current_user.full_name or "",
                "email": current_user.email,
                "phone": "",
                "title": "",
                "bio": "",
                "avatar": None
            },
            "organization": {
                "name": current_user.organization or "",
                "type": "NGO",
                "address": "",
                "city": "",
                "country": "",
                "website": "",
                "description": ""
            },
            "expertise": {
                "areas": [],
                "languages": [],
                "experience": "",
                "certifications": []
            },
            "social": {
                "linkedin": "",
                "twitter": "",
                "orcid": ""
            }
        }
    
    profile = user_profiles[current_user.id]
    
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
    
    # Update profile in memory storage
    profile_dict = profile_update.dict(exclude={"stats"})  # Don't update stats from client
    
    if current_user.id not in user_profiles:
        user_profiles[current_user.id] = {}
    
    user_profiles[current_user.id].update(profile_dict)
    
    # Update user model with basic info
    if profile_update.personalInfo.fullName:
        current_user.full_name = profile_update.personalInfo.fullName
    if profile_update.personalInfo.email and profile_update.personalInfo.email != current_user.email:
        current_user.email = profile_update.personalInfo.email
    if profile_update.organization.name:
        current_user.organization = profile_update.organization.name
    
    db.commit()
    
    return {"message": "Profile updated successfully"}

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Upload profile avatar"""
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read and encode file
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode()
    
    # Store avatar in profile
    if current_user.id not in user_profiles:
        user_profiles[current_user.id] = {"personalInfo": {}}
    
    if "personalInfo" not in user_profiles[current_user.id]:
        user_profiles[current_user.id]["personalInfo"] = {}
    
    user_profiles[current_user.id]["personalInfo"]["avatar"] = f"data:{file.content_type};base64,{base64_image}"
    
    return {"message": "Avatar uploaded successfully"}

@router.get("/completion-tips")
async def get_completion_tips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, str]]:
    """Get tips for completing profile"""
    
    tips = []
    
    if current_user.id not in user_profiles:
        tips.append({
            "section": "profile",
            "tip": "Start by adding your basic information"
        })
        return tips
    
    profile = user_profiles[current_user.id]
    
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
    
    # Million euro badge
    total_funding = sum(p.budget or 0 for p in proposals if p.status == "approved")
    if total_funding >= 1000000:
        badges.append({
            "id": "million_euro",
            "name": "Million Euro Club",
            "description": "Secured over €1M in funding",
            "icon": "euro",
            "earned": True
        })
    
    return badges