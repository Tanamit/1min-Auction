from fastapi import APIRouter, Header, Query, HTTPException
from app.Service.db_connection import get_supabase_client
import base64

router = APIRouter(prefix="/api/seller", tags=["Seller Product List"])

PRODUCT_TABLE = "product"


def _hex_to_base64(hex_str: str) -> str | None:
    """แปลง hex string จาก Supabase bytea เป็น base64 สำหรับ frontend"""
    if not hex_str or not isinstance(hex_str, str):
        return None
    
    try:
        # ลบ prefix \\x หรือ \x
        clean = hex_str
        if clean.startswith("\\\\x"):
            clean = clean[3:]
        elif clean.startswith("\\x"):
            clean = clean[2:]
        elif clean.startswith("0x"):
            clean = clean[2:]
        
        # แปลง hex เป็น bytes แล้วเป็น base64
        img_bytes = bytes.fromhex(clean)
        return base64.b64encode(img_bytes).decode("utf-8")
    except Exception as e:
        print(f"Error converting hex to base64: {e}")
        return None


@router.get("/products")
def list_products(
    user_id: str = Header(..., alias="X-User-Id"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    status_id: int | None = Query(None, ge=1)
):
    supabase = get_supabase_client()

    q = supabase.table(PRODUCT_TABLE).select(
        "product_id, product_name, product_desc, product_cat_id, start_price, start_time, end_time, status_id, product_img",
        count="exact"
    ).eq("seller_id", user_id)

    if status_id is not None:
        q = q.eq("status_id", status_id)
    if search:
        like = f"%{search}%"
        q = q.or_(f"product_name.ilike.{like},product_desc.ilike.{like}")

    q = q.order("start_time", desc=True)

    from_idx = (page - 1) * page_size
    to_idx = from_idx + page_size - 1
    res = q.range(from_idx, to_idx).execute()

    if getattr(res, "error", None):
        raise HTTPException(500, detail=str(res.error))

    # แปลง product_img จาก hex เป็น base64
    items = []
    for item in (res.data or []):
        img = item.get("product_img")
        if img:
            item["product_img"] = _hex_to_base64(img)
        items.append(item)

    return {"items": items, "total": res.count or 0}