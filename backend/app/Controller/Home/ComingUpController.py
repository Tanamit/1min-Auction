from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from Service.Home.comingup_service import get_coming_up_products

router = APIRouter(prefix="/api/products/coming-up", tags=["home", "products"])

@router.get("/", response_model=List[Dict[str, Any]])
def list_coming_up(limit: int = Query(60, ge=1, le=500)):
    """
    GET /api/products/coming-up/?limit=60
    Returns products for ComingUp.jsx (mapped in Model).
    """
    try:
        return get_coming_up_products(limit=limit)
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to load coming up products")