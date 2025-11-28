from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from Service.Home.explore_product_service import get_explore_products

router = APIRouter(prefix="/api/products/explore", tags=["home", "products"])

@router.get("/", response_model=List[Dict[str, Any]])
def list_explore(limit: int = Query(50, ge=1, le=200)):
    """
    GET /api/products/explore/?limit=50
    Returns products for ExploreProduct.jsx (mapped in Model).
    """
    try:
        return get_explore_products(limit=limit)
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to load explore products")