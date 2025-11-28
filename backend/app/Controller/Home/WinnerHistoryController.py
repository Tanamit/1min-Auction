# ...existing code...
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

# Controller should be thin — call the service layer for business logic
from app.Service.Home.winner_history_service import get_recent_winners

router = APIRouter(prefix="/api/winners", tags=["home"])

@router.get("/", response_model=List[Dict[str, Any]])
def list_winners(limit: int = 20):
    """
    Returns recent winners for WinnerHistory.jsx.

    Frontend fields expected (comment):
      - id
      - sku / productId
      - winnerName
      - finalPrice
      - imageUrl
    """
    try:
        data = get_recent_winners(limit=limit)
        return data
    except Exception:
        # keep error message small for frontend
        raise HTTPException(status_code=500, detail="Unable to load winners")
# ...existing code...