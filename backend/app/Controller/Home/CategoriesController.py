from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional

# Controller should be thin: import business logic from the service layer
from app.Service.Home.categories_service import (
    get_categories,
    get_products_by_category,
)

router = APIRouter(prefix="/api/categories", tags=["home"])

@router.get("/", response_model=List[str])
def list_categories():
    """
    GET /api/categories
    Returns a list of category names.
    """
    try:
        return get_categories()
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to load categories")

@router.get("/{category}/products", response_model=List[Dict[str, Any]])
def products_by_category(
    category: str,
    limit: int = Query(50, ge=1, le=200),
    source: Optional[str] = Query(None, description="Filter by source: 'upcoming'|'explore'"),
    onlyActive: bool = Query(False, description="Only include active products")
):
    """
    GET /api/categories/{category}/products
      query params: ?limit=50&source=explore&onlyActive=true
    """
    try:
        data = get_products_by_category(category=category, limit=limit, source=source, onlyActive=onlyActive)
        return data
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to load products for category")