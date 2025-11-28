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
        
        # แปลง hex เป็น bytes
        img_bytes = bytes.fromhex(clean)
        
        # เช็คว่าเป็นรูปภาพจริงหรือไม่ (JPEG, PNG, GIF, WEBP)
        is_jpeg = img_bytes[:3] == b'\xff\xd8\xff'
        is_png = img_bytes[:8] == b'\x89PNG\r\n\x1a\n'
        is_gif = img_bytes[:3] == b'GIF'
        is_webp = img_bytes[:4] == b'RIFF' and img_bytes[8:12] == b'WEBP'
        
        if is_jpeg or is_png or is_gif or is_webp:
            # เป็นรูปภาพจริง - แปลงเป็น base64
            return base64.b64encode(img_bytes).decode("utf-8")
        
        # ไม่ใช่รูปภาพ - อาจเป็น base64 string ที่ถูกเก็บเป็น bytes (double encoded)
        # ลอง decode เป็น string แล้วเช็คว่าเป็น base64 ของรูปหรือไม่
        try:
            maybe_b64 = img_bytes.decode("utf-8")
            
            # เช็คว่าเป็น base64 ของรูปจริงไหม
            if maybe_b64.startswith("/9j/"):  # JPEG
                return maybe_b64
            if maybe_b64.startswith("iVBOR"):  # PNG
                return maybe_b64
            if maybe_b64.startswith("R0lG"):   # GIF
                return maybe_b64
            if maybe_b64.startswith("UklG"):   # WEBP
                return maybe_b64
            
            # ลอง decode base64 อีกรอบ (triple encoded case)
            decoded = base64.b64decode(maybe_b64)
            is_jpeg2 = decoded[:3] == b'\xff\xd8\xff'
            is_png2 = decoded[:8] == b'\x89PNG\r\n\x1a\n'
            is_gif2 = decoded[:3] == b'GIF'
            is_webp2 = decoded[:4] == b'RIFF' and decoded[8:12] == b'WEBP'
            
            if is_jpeg2 or is_png2 or is_gif2 or is_webp2:
                # เป็น double encoded - return base64 ที่ถูกต้อง
                return base64.b64encode(decoded).decode("utf-8")
            
        except Exception:
            pass
        
        # ไม่สามารถแปลงได้ - return None
        return None
        
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