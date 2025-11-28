from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from Service.db_connection import get_supabase_client

PLACEHOLDER = "https://via.placeholder.com/300x300?text=No+Image"

def _compute_time_left(end_time_iso: Optional[str]) -> int:
    if not end_time_iso:
        return 0
    try:
        end = datetime.fromisoformat(end_time_iso.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        delta = end - now
        return max(0, int(delta.total_seconds()))
    except Exception:
        return 0

def _map_row_to_product(r: Dict[str, Any]) -> Dict[str, Any]:
    end_time = r.get("end_time") or r.get("auction_end") or None
    time_left = _compute_time_left(end_time)
    return {
        "id": r.get("product_id") or r.get("id"),
        "name": r.get("product_name") or r.get("name"),
        "startPrice": r.get("start_price") or r.get("starting_price") or 0,
        "image": r.get("product_img") or r.get("product_image") or PLACEHOLDER,
        "timeLeft": time_left,
        "status": r.get("status") or ("expired" if time_left <= 0 else "active"),
        "views": r.get("views") or 0,
        "likes": r.get("likes") or 0,
        "auctionId": r.get("auction_id") or r.get("auctionId"),
        "listedBy": r.get("listed_by") or r.get("listedBy"),
        "category": r.get("category") or "Uncategorized",
        "description": r.get("description") or "",
        "condition": r.get("condition") or "",
        "currentBid": r.get("current_bid") or r.get("currentBid") or 0,
        "totalBids": r.get("total_bids") or r.get("totalBids") or 0,
        "source": r.get("source") or "coming_up"
    }

def get_coming_up_products(limit: int = 60) -> List[Dict[str, Any]]:
    supabase = get_supabase_client()
    try:
        select_cols = (
            "product_id, product_name, product_img, start_price, end_time, status, views, likes, "
            "auction_id, listed_by, category, description, condition, current_bid, total_bids, source, start_time"
        )
        resp = (
            supabase
            .from_("product")
            .select(select_cols)
            .or_("source.eq.coming_up,start_time.gt.now()")
            .order("start_time", desc=False)
            .limit(int(limit))
            .execute()
        )
        rows = getattr(resp, "data", []) or []
        result = [_map_row_to_product(r) for r in rows]
        if not result:
            return [
                {
                    "id": f"UP-SAMPLE-{i}",
                    "name": f"Sample Upcoming {i}",
                    "startPrice": 120 + i * 10,
                    "image": PLACEHOLDER,
                    "timeLeft": 3600 * ((i + 1) % 6),
                    "status": "active",
                    "views": 50 + i * 3,
                    "likes": 5 + i,
                    "auctionId": f"UP-AUC-{i}",
                    "listedBy": "seller_demo",
                    "category": "Collectibles",
                    "description": "Upcoming demo product",
                    "condition": "Used - good",
                    "currentBid": 100 + i * 10,
                    "totalBids": i % 10,
                    "source": "coming_up"
                } for i in range(1, min(limit, 10) + 1)
            ]
        return result[:limit]
    except Exception:
        return [
            {
                "id": f"UP-ERR-{i}",
                "name": f"Upcoming Error {i}",
                "startPrice": 150,
                "image": PLACEHOLDER,
                "timeLeft": 0,
                "status": "expired",
                "views": 0,
                "likes": 0,
                "auctionId": "ERR",
                "listedBy": "err",
                "category": "Misc",
                "description": "",
                "condition": "",
                "currentBid": 0,
                "totalBids": 0,
                "source": "coming_up"
            } for i in range(1, min(limit, 4) + 1)
        ]