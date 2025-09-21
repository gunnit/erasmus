from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel

from ..db.database import get_db
from ..db.models import Partner, PartnerType, User, Proposal
from .dependencies import get_current_user
from ..schemas.partner import PartnerCreate, PartnerUpdate, PartnerResponse, PartnerListResponse
from ..services.web_crawler_service import WebCrawlerService
from ..services.partner_affinity_service import PartnerAffinityService
from ..services.ai_partner_finder_service import AIPartnerFinderService

router = APIRouter(prefix="/api/partners", tags=["partners"])

@router.get("/", response_model=PartnerListResponse)
def list_partners(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    partner_type: Optional[str] = None,
    country: Optional[str] = None,
    min_affinity: Optional[float] = None,
    sort_by: str = Query("created_at", regex="^(name|affinity_score|created_at|updated_at)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$")
):
    """List all partners for the current user with pagination and filters"""
    query = db.query(Partner).filter(Partner.user_id == current_user.id)

    # Apply filters
    if search:
        query = query.filter(
            Partner.name.ilike(f"%{search}%") |
            Partner.description.ilike(f"%{search}%")
        )

    if partner_type:
        try:
            partner_enum = PartnerType[partner_type.upper()]
            query = query.filter(Partner.type == partner_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid partner type: {partner_type}")

    if country:
        query = query.filter(Partner.country.ilike(f"%{country}%"))

    if min_affinity is not None:
        query = query.filter(Partner.affinity_score >= min_affinity)

    # Apply sorting
    order_column = getattr(Partner, sort_by)
    if sort_order == "desc":
        query = query.order_by(order_column.desc())
    else:
        query = query.order_by(order_column.asc())

    # Pagination
    total = query.count()
    partners = query.offset((page - 1) * per_page).limit(per_page).all()

    return PartnerListResponse(
        partners=partners,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page
    )

@router.post("/", response_model=PartnerResponse)
def create_partner(
    partner: PartnerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new partner"""
    try:
        partner_type_enum = PartnerType[partner.type.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid partner type: {partner.type}")

    db_partner = Partner(
        user_id=current_user.id,
        name=partner.name,
        type=partner_type_enum,
        country=partner.country,
        website=partner.website,
        description=partner.description,
        expertise_areas=partner.expertise_areas or [],
        contact_info=partner.contact_info or {}
    )

    db.add(db_partner)
    db.commit()
    db.refresh(db_partner)

    return db_partner

@router.get("/{partner_id}", response_model=PartnerResponse)
def get_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific partner"""
    partner = db.query(Partner).filter(
        Partner.id == partner_id,
        Partner.user_id == current_user.id
    ).first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    return partner

@router.put("/{partner_id}", response_model=PartnerResponse)
def update_partner(
    partner_id: int,
    partner_update: PartnerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a partner"""
    partner = db.query(Partner).filter(
        Partner.id == partner_id,
        Partner.user_id == current_user.id
    ).first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Update fields if provided
    if partner_update.name is not None:
        partner.name = partner_update.name

    if partner_update.type is not None:
        try:
            partner.type = PartnerType[partner_update.type.upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid partner type: {partner_update.type}")

    if partner_update.country is not None:
        partner.country = partner_update.country

    if partner_update.website is not None:
        partner.website = partner_update.website

    if partner_update.description is not None:
        partner.description = partner_update.description

    if partner_update.expertise_areas is not None:
        partner.expertise_areas = partner_update.expertise_areas

    if partner_update.contact_info is not None:
        partner.contact_info = partner_update.contact_info

    partner.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(partner)

    return partner

@router.delete("/{partner_id}")
def delete_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a partner"""
    partner = db.query(Partner).filter(
        Partner.id == partner_id,
        Partner.user_id == current_user.id
    ).first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    db.delete(partner)
    db.commit()

    return {"message": "Partner deleted successfully"}

@router.post("/{partner_id}/crawl", response_model=PartnerResponse)
async def crawl_partner_website(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crawl partner website to extract information"""
    partner = db.query(Partner).filter(
        Partner.id == partner_id,
        Partner.user_id == current_user.id
    ).first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    if not partner.website:
        raise HTTPException(status_code=400, detail="Partner has no website URL")

    try:
        crawler = WebCrawlerService()
        crawled_data = await crawler.crawl_website(partner.website)

        # Update partner with crawled data
        partner.crawled_data = crawled_data
        partner.last_crawled = datetime.utcnow()

        # Auto-update fields if they're empty
        if not partner.description and crawled_data.get("description"):
            partner.description = crawled_data["description"]

        if not partner.expertise_areas and crawled_data.get("expertise"):
            partner.expertise_areas = crawled_data["expertise"]

        if not partner.contact_info.get("email") and crawled_data.get("contact", {}).get("email"):
            partner.contact_info = {**partner.contact_info, **crawled_data.get("contact", {})}

        db.commit()
        db.refresh(partner)

        return partner

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to crawl website: {str(e)}")

@router.post("/{partner_id}/calculate-affinity")
async def calculate_partner_affinity(
    partner_id: int,
    project_context: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate affinity score between partner and project"""
    partner = db.query(Partner).filter(
        Partner.id == partner_id,
        Partner.user_id == current_user.id
    ).first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    try:
        affinity_service = PartnerAffinityService()
        result = await affinity_service.calculate_affinity(partner, project_context)

        # Update partner with affinity score
        partner.affinity_score = result["score"]
        partner.affinity_explanation = result["explanation"]

        db.commit()
        db.refresh(partner)

        return {
            "partner_id": partner.id,
            "score": result["score"],
            "explanation": result["explanation"],
            "factors": result.get("factors", [])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate affinity: {str(e)}")

@router.get("/search")
def search_partners(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Quick search for partners with optional country filter"""
    query = db.query(Partner).filter(
        Partner.user_id == current_user.id,
        Partner.name.ilike(f"%{q}%") | Partner.description.ilike(f"%{q}%")
    )

    # Apply country filter if provided
    if country:
        query = query.filter(Partner.country.ilike(f"%{country}%"))

    partners = query.limit(limit).all()

    # Convert to response model
    return [PartnerResponse.from_orm(partner) for partner in partners]

@router.post("/batch-affinity")
async def calculate_batch_affinity(
    partner_ids: List[int],
    project_context: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate affinity scores for multiple partners"""
    partners = db.query(Partner).filter(
        Partner.id.in_(partner_ids),
        Partner.user_id == current_user.id
    ).all()

    if not partners:
        raise HTTPException(status_code=404, detail="No partners found")

    results = []
    affinity_service = PartnerAffinityService()

    for partner in partners:
        try:
            result = await affinity_service.calculate_affinity(partner, project_context)
            partner.affinity_score = result["score"]
            partner.affinity_explanation = result["explanation"]
            results.append({
                "partner_id": partner.id,
                "partner_name": partner.name,
                "score": result["score"]
            })
        except Exception as e:
            results.append({
                "partner_id": partner.id,
                "partner_name": partner.name,
                "error": str(e)
            })

    db.commit()

    return {"results": results}

# AI Partner Finding Models
class AIPartnerSearchCriteria(BaseModel):
    """Model for AI partner search criteria"""
    partner_types: Optional[List[str]] = None
    countries: Optional[List[str]] = None
    expertise_areas: Optional[List[str]] = None
    custom_requirements: Optional[str] = None
    project_field: Optional[str] = "Adult Education"

class AIPartnerSearchRequest(BaseModel):
    """Request model for AI partner finding"""
    search_mode: str  # "criteria" or "proposal"
    criteria: Optional[AIPartnerSearchCriteria] = None
    proposal_id: Optional[int] = None
    num_partners: int = 5

class SaveSuggestedPartnersRequest(BaseModel):
    """Request model for saving AI-suggested partners"""
    partners: List[Dict]

@router.post("/ai-find")
async def find_partners_with_ai(
    request: AIPartnerSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Find partners using AI based on criteria or proposal"""
    ai_service = AIPartnerFinderService()

    try:
        if request.search_mode == "criteria":
            if not request.criteria:
                raise HTTPException(status_code=400, detail="Criteria required for criteria-based search")

            # Convert criteria to dict
            criteria_dict = request.criteria.dict()

            # Generate partners based on criteria
            partners = await ai_service.find_partners_by_criteria(
                criteria=criteria_dict,
                num_partners=request.num_partners
            )

        elif request.search_mode == "proposal":
            if not request.proposal_id:
                raise HTTPException(status_code=400, detail="Proposal ID required for proposal-based search")

            # Fetch the proposal
            proposal = db.query(Proposal).filter(
                Proposal.id == request.proposal_id,
                Proposal.user_id == current_user.id
            ).first()

            if not proposal:
                raise HTTPException(status_code=404, detail="Proposal not found")

            # Generate partners based on proposal
            partners = await ai_service.find_partners_for_proposal(
                proposal=proposal,
                num_partners=request.num_partners
            )

        else:
            raise HTTPException(status_code=400, detail="Invalid search mode. Use 'criteria' or 'proposal'")

        return {
            "success": True,
            "partners": partners,
            "total": len(partners),
            "search_mode": request.search_mode
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate partner suggestions: {str(e)}")

@router.post("/save-suggestions")
async def save_suggested_partners(
    request: SaveSuggestedPartnersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save AI-suggested partners to user's library"""
    ai_service = AIPartnerFinderService()
    saved_partners = []
    skipped_partners = []

    for partner_data in request.partners:
        try:
            # Validate partner data
            if not ai_service.validate_partner_data(partner_data):
                skipped_partners.append({
                    "name": partner_data.get('name', 'Unknown'),
                    "reason": "Invalid or incomplete data"
                })
                continue

            # Check if partner already exists
            existing_partner = db.query(Partner).filter(
                Partner.user_id == current_user.id,
                Partner.name == partner_data['name'],
                Partner.country == partner_data.get('country')
            ).first()

            if existing_partner:
                skipped_partners.append({
                    "name": partner_data['name'],
                    "reason": "Partner already exists in library"
                })
                continue

            # Create new partner
            try:
                partner_type_enum = PartnerType[partner_data['type'].upper()]
            except KeyError:
                partner_type_enum = PartnerType.NGO  # Default to NGO

            new_partner = Partner(
                user_id=current_user.id,
                name=partner_data['name'],
                type=partner_type_enum,
                country=partner_data.get('country'),
                website=partner_data.get('website'),
                description=partner_data.get('description'),
                expertise_areas=partner_data.get('expertise_areas', []),
                contact_info=partner_data.get('contact_info', {}),
                affinity_score=partner_data.get('compatibility_score')
            )

            db.add(new_partner)
            saved_partners.append({
                "name": new_partner.name,
                "id": None  # Will be set after commit
            })

        except Exception as e:
            skipped_partners.append({
                "name": partner_data.get('name', 'Unknown'),
                "reason": f"Error: {str(e)}"
            })

    # Commit all partners at once
    if saved_partners:
        db.commit()

        # Get the IDs of newly created partners
        for partner_info in saved_partners:
            partner = db.query(Partner).filter(
                Partner.user_id == current_user.id,
                Partner.name == partner_info['name']
            ).order_by(Partner.created_at.desc()).first()
            if partner:
                partner_info['id'] = partner.id

    return {
        "success": True,
        "saved_count": len(saved_partners),
        "saved_partners": saved_partners,
        "skipped_count": len(skipped_partners),
        "skipped_partners": skipped_partners
    }

@router.post("/analyze-gaps")
async def analyze_partnership_gaps(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze gaps in current partnership for a proposal"""
    # Fetch the proposal
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.user_id == current_user.id
    ).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    # Get existing partners (from library_partners relationship or JSON field)
    existing_partners = proposal.library_partners
    if not existing_partners and proposal.partners:
        # Create temporary Partner objects from JSON data for analysis
        existing_partners = []
        for p in proposal.partners:
            temp_partner = Partner(
                name=p.get('name', ''),
                type=PartnerType.NGO,  # Default type
                country=p.get('country', ''),
                expertise_areas=p.get('expertise_areas', [])
            )
            existing_partners.append(temp_partner)

    # Create project context
    project_context = {
        'title': proposal.title,
        'project_idea': proposal.project_idea,
        'priorities': proposal.priorities,
        'target_groups': proposal.target_groups
    }

    # Analyze gaps
    ai_service = AIPartnerFinderService()
    try:
        analysis = await ai_service.analyze_partnership_gaps(
            existing_partners=existing_partners,
            project_context=project_context
        )

        return {
            "success": True,
            "proposal_id": proposal_id,
            "proposal_title": proposal.title,
            "current_partner_count": len(existing_partners),
            "analysis": analysis
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze partnership gaps: {str(e)}")