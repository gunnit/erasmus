from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.database import get_db
from ..db.models import Partner, PartnerType, User, Proposal
from .dependencies import get_current_user
from ..schemas.partner import PartnerCreate, PartnerUpdate, PartnerResponse, PartnerListResponse
from ..services.web_crawler_service import WebCrawlerService
from ..services.partner_affinity_service import PartnerAffinityService

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

@router.get("/search", response_model=List[PartnerResponse])
def search_partners(
    q: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Quick search for partners"""
    partners = db.query(Partner).filter(
        Partner.user_id == current_user.id,
        Partner.name.ilike(f"%{q}%") | Partner.description.ilike(f"%{q}%")
    ).limit(limit).all()

    return partners

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