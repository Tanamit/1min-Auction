
# backend/app/Controller/ProductController.py

from fastapi import APIRouter
from datetime import datetime, timedelta
from app.Service.db_connection import supabase

router = APIRouter(prefix="/products", tags=["Products"])

# ======================================================
# ✅ FIXED CLOCK
# ======================================================
VIRTUAL_START = datetime(2025, 10, 21, 3, 0, 0)
REAL_START = datetime(2025, 11, 13, 0, 0, 0)

def get_virtual_now() -> datetime:
    """
    Virtual hour is always 03:00 — only minutes and seconds follow real time.
    Example:
      Real 02:10 -> Virtual 03:10
      Real 02:55 -> Virtual 03:55
    """
    now = datetime.now()
    return VIRTUAL_START.replace(minute=now.minute, second=now.second, microsecond=0)

# ======================================================
# ✅ GET CATEGORIES ENDPOINT
# ======================================================
@router.get("/categories")
def get_categories():
    """
    Return list of product categories.
    """
    res = (
        supabase.table("category")
        .select("category_id, category_name")
        .order("category_id", desc=False)
        .execute()
    )
    return {"categories": res.data or []}


# ======================================================
# ✅ UPCOMING PRODUCTS
# ======================================================
@router.get("/upcoming")
def get_upcoming_products(limit: int = 60):
    """
    Return upcoming product list — mapped to fixed virtual time slots.
    """
    res = (
        supabase.table("product")
        .select(
            "product_id, product_name, product_desc, product_img, "
            "start_price, seller_id, start_time, end_time, product_cat_id"
        )
        .order("start_time", desc=False)
        .limit(limit)
        .execute()
    )

    products = res.data or []

    virtual_items = []
    for i, prod in enumerate(products):
        virtual_time = VIRTUAL_START + timedelta(minutes=i)
        virtual_items.append({
            "virtual_start": virtual_time.strftime("%Y-%m-%d %H:%M:%S"),
            "real_product_id": prod.get("product_id"),
            "product_name": prod.get("product_name"),
            "product_desc": prod.get("product_desc"),
            "product_img": prod.get("product_img"),
            "start_price": prod.get("start_price"),
            "seller_id": prod.get("seller_id"),
            "product_cat_id": prod.get("product_cat_id"),
        })

    return {
        "virtual_time": get_virtual_now().strftime("%Y-%m-%d %H:%M:%S"),
        "items": virtual_items,
    }


# ======================================================
# ✅ CURRENTLY BIDDING PRODUCT
# ======================================================
@router.get("/bidding-now")
def get_bidding_now():
    """
    Always show the product whose virtual minute matches real time.
    (Hour is always fixed at 03)
    """
    virtual_now = get_virtual_now()
    next_minute = virtual_now + timedelta(minutes=1)

    res = (
        supabase.table("product")
        .select(
            "product_id, product_name, product_desc, product_img, "
            "start_price, seller_id, start_time, end_time"
        )
        .gte("start_time", virtual_now.strftime("%Y-%m-%d %H:%M:%S"))
        .lt("start_time", next_minute.strftime("%Y-%m-%d %H:%M:%S"))
        .limit(1)
        .execute()
    )

    data = res.data or []
    return {
        "virtual_now": virtual_now.strftime("%Y-%m-%d %H:%M:%S"),
        "bidding_now": data[0] if data else None,
    }

# ======================================================
# ✅ DEBUG /time/virtual ENDPOINT
# ======================================================
@router.get("/time/virtual")
def get_virtual_time():
    """
    Returns current virtual seconds for perfect frontend sync.
    Frontend expects field: seconds
    """
    now = datetime.now()
    virtual_now = get_virtual_now()

    return {
        "virtual_time": virtual_now.strftime("%Y-%m-%d %H:%M:%S"),
        "real_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "hour": virtual_now.hour,
        "minute": virtual_now.minute,
        "seconds": now.second,    # 🔥 required for countdown sync
    }

# ======================================================
# ✅ NEXT REFRESH ENDPOINT
# ======================================================
@router.get("/time/next-refresh")
def get_next_refresh():
    """
    Returns how many seconds remain until the next virtual minute tick.
    Example:
      If real time is 02:55:27 → virtual 03:55:27
      Then next refresh = 33 seconds (until 03:56)
    """
    now = datetime.now()
    virtual_now = get_virtual_now()

    # Calculate seconds until next minute
    seconds_until_next_min = 60 - now.second
    next_virtual = virtual_now + timedelta(minutes=1)
    next_virtual = next_virtual.replace(second=0, microsecond=0)

    return {
        "virtual_now": virtual_now.strftime("%Y-%m-%d %H:%M:%S"),
        "next_refresh_at": next_virtual.strftime("%Y-%m-%d %H:%M:%S"),
        "seconds_left": seconds_until_next_min
    }

# ======================================================
# ✅ GET WINNER PRODUCTS
# ======================================================
# ...existing winners endpoint replace its body...
@router.get("/winners")
def list_winners(limit: int = 20):

    # Fetch winner products (status_id = 4)
    res = (
        supabase.table("product")
        .select("*")
        .eq("status_id", 4)
        .order("end_time", desc=True)
        .limit(limit)
        .execute()
    )
    rows = res.data or []
    product_ids = [r.get("product_id") for r in rows if r.get("product_id")]

    # Map winner_id -> user_name
    winner_ids = [r.get("winner_id") for r in rows if r.get("winner_id")]
    user_map: dict[str, str] = {}
    if winner_ids:
        ures = (
            supabase.table("users")
            .select("user_id,user_name")
            .in_("user_id", winner_ids)
            .execute()
        )
        for u in (ures.data or []):
            user_map[u["user_id"]] = u.get("user_name") or "Unknown"

    # Fetch bids for these products and compute max bid_amount
    max_bid_map: dict[str, float] = {}
    if product_ids:
        bres = (
            supabase.table("bid")
            .select("product_id,bid_amount")
            .in_("product_id", product_ids)
            .execute()
        )
        for b in (bres.data or []):
            pid = b.get("product_id")
            amt = b.get("bid_amount")
            if pid is None or amt is None:
                continue
            cur = max_bid_map.get(pid)
            if cur is None or amt > cur:
                max_bid_map[pid] = amt

    items = []
    for r in rows:
        pid = r.get("product_id")
        wid = r.get("winner_id")
        # Prefer stored final_price, else max bid, else start_price
        stored_final = r.get("final_price")
        computed_final = stored_final if stored_final not in (None, "") else max_bid_map.get(pid, r.get("start_price"))
        items.append({
            "product_id": pid,
            "product_name": r.get("product_name"),
            "product_desc": r.get("product_desc"),
            "product_cat_id": r.get("product_cat_id"),
            "product_img": r.get("product_img"),
            "start_price": r.get("start_price"),
            "final_price": computed_final,
            "winner_id": wid,
            "winner_name": user_map.get(wid, "Unknown"),
            "start_time": r.get("start_time"),
            "end_time": r.get("end_time"),
        })
    return {"items": items}

# ======================================================
# ✅ UPDATE PRODUCTS
# ======================================================
@router.put("/status/{product_id}")
def update_status(product_id: str, target: int = 8):
    """
    Update product.status_id to target (default 8).
    For upcoming->bidding use target=8.
    Conditional so it only promotes if currently status_id=2.
    """
    allowed = {2,4,8}
    if target not in allowed:
        return {"updated": None, "message": "Invalid target status"}

    # Fetch current status
    current = (
        supabase.table("product")
        .select("product_id,status_id")
        .eq("product_id", product_id)
        .single()
        .execute()
    )
    if getattr(current, "error", None) or not current.data:
        return {"updated": None, "message": "Product not found"}

    old_status = current.data["status_id"]

    # Only promote 2 -> 8 for now
    if old_status == 2 and target == 8:
        updated = (
            supabase.table("product")
            .update({"status_id": 8})
            .eq("product_id", product_id)
            .eq("status_id", 2)  # guard against race
            .execute()
        )
        if getattr(updated, "error", None) or not updated.data:
            return {"updated": None, "message": "Promotion failed or already changed"}
        row = updated.data[0]
        return {
            "updated": {
                "product_id": row.get("product_id"),
                "old_status_id": old_status,
                "new_status_id": row.get("status_id"),
            },
            "message": "Promoted 2 -> 8"
        }

    return {
        "updated": {
            "product_id": product_id,
            "old_status_id": old_status,
            "new_status_id": old_status,
        },
        "message": "No change (not status 2 or target not 8)"
    }
