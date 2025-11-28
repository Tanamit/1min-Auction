from typing import List, Dict, Any, Optional
from Service.db_connection import get_supabase_client

PLACEHOLDER = "https://via.placeholder.com/300x300?text=No+Image"

# Frontend (Categories.jsx) expects product items with fields:
# - id          : product id (product_id)
# - name        : product name (product_name)
# - startPrice  : numeric start price (start_price)
# - image       : product image url (product_img)
# - timeLeft    : seconds left until auction end (compute from end_time)
# - status      : active | sold | expired
# - views       : integer (views)
# - likes       : integer (likes)
# - category    : product category (category)
# - source      : 'upcoming' | 'explore' (if you store source)
#
# If using Supabase, select product columns and compute timeLeft in Python.
# Example Supabase select (comment):
#   supabase.from_("product").select("product_id, product_name, product_img, start_price, end_time, status, views, likes, category, source")
# If you need related tables (e.g. stats table), include relationship select syntax.

def _compute_time_left(end_time_iso: Optional[str]) -> int:
    # returns seconds left (server timezone assumed UTC); if no end_time return 0
    try:
        if not end_time_iso:
            return 0
        from datetime import datetime, timezone
        end = datetime.fromisoformat(end_time_iso)
        now = datetime.now(timezone.utc)
        delta = end - now
        return max(0, int(delta.total_seconds()))
    except Exception:
        return 0

def get_categories() -> List[Dict[str, Any]]:
    """
    Return list of distinct categories (string list) from product table.
    """
    supabase = get_supabase_client()
    try:
        # PostgREST distinct select for category
        resp = supabase.from_("product").select("category", count="exact", distinct="category").limit(100).execute()
        rows = getattr(resp, "data", []) or []
        # if category stored as array or null handle defensively
        cats = []
        for r in rows:
            c = r.get("category")
            if c and c not in cats:
                cats.append(c)
        if not cats:
            # fallback sample categories
            return ["Electronics", "Jewelry", "Collectibles", "Event tickets", "Memorabilia"]
        return cats
    except Exception:
        return ["Electronics", "Jewelry", "Collectibles", "Event tickets", "Memorabilia"]

def get_products_by_category(category: str, limit: int = 50, source: Optional[str] = None, onlyActive: bool = False) -> List[Dict[str, Any]]:
    """
    Returns products of a category mapped to the frontend shape.
    Query notes (commented):
      - SELECT product_id, product_name, product_img, start_price, end_time, status, views, likes, category, source
      - WHERE category = :category
      - Optional WHERE source = :source
      - Optional WHERE status = 'active' if onlyActive
      - ORDER BY start_time ASC (or as desired)
    """
    supabase = get_supabase_client()
    try:
        select_cols = "product_id, product_name, product_img, start_price, end_time, status, views, likes, category, source"
        query = supabase.from_("product").select(select_cols).eq("category", category)

        if source:
            query = query.eq("source", source)
        if onlyActive:
            query = query.eq("status", "active")

        resp = query.order("start_time", desc=False).limit(int(limit)).execute()
        rows = getattr(resp, "data", []) or []

        result = []
        for r in rows:
            end_time = r.get("end_time") or r.get("auction_end") or None
            time_left = _compute_time_left(end_time)
            result.append({
                "id": r.get("product_id"),
                "name": r.get("product_name") or r.get("name"),
                "startPrice": r.get("start_price") or r.get("starting_price") or 0,
                "image": r.get("product_img") or PLACEHOLDER,
                "timeLeft": time_left,
                "status": r.get("status") or ("expired" if time_left <= 0 else "active"),
                "views": r.get("views") or 0,
                "likes": r.get("likes") or 0,
                "category": r.get("category") or category,
                "source": r.get("source") or "explore",
            })

        if not result:
            # fallback sample: small generated sample so front-end still shows something
            return [
                {
                    "id": f"EX-SAMPLE-{i}",
                    "name": f"Sample Product {i}",
                    "startPrice": 100 + i * 10,
                    "image": PLACEHOLDER,
                    "timeLeft": 3600 * (i % 5),
                    "status": "active",
                    "views": 100 + i * 5,
                    "likes": 10 + i,
                    "category": category,
                    "source": "explore",
                } for i in range(1, min(limit, 8) + 1)
            ]

        return result

    except Exception:
        # fallback sample
        return [
            {
                "id": f"EX-ERR-{i}",
                "name": f"Error Sample {i}",
                "startPrice": 150,
                "image": PLACEHOLDER,
                "timeLeft": 0,
                "status": "expired",
                "views": 0,
                "likes": 0,
                "category": category,
                "source": "explore",
            } for i in range(1, min(limit, 4) + 1)
        ]