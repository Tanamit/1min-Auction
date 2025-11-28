import uuid
import base64
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from app.Service.db_connection import get_supabase_client

router = APIRouter(prefix="/api/seller", tags=["Product"])

CATEGORY_TABLE = "category"
PRODUCT_TABLE = "product"


def _normalize_to_timestamp_no_tz(iso_str: str) -> str:
    """
    Convert e.g. '2025-10-21T03:31:00+07:00' -> '2025-10-21 03:31:00'
    เก็บเวลา local time โดยไม่แปลงเป็น UTC
    """
    try:
        dt = datetime.fromisoformat(iso_str)
    except Exception:
        raise HTTPException(400, detail="Invalid start_time format (must be ISO 8601)")

    # เก็บเวลา local time โดยไม่แปลง timezone
    # ลบ timezone info ออกแล้วเก็บเวลาตามที่ user เลือก
    naive = dt.replace(tzinfo=None)
    return naive.strftime("%Y-%m-%d %H:%M:%S")


@router.get("/categories")
def get_categories():
    supabase = get_supabase_client()
    res = supabase.table(CATEGORY_TABLE).select("category_id, category_name").order("category_id").execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))
    return res.data


@router.get("/products/check-slot")
def check_slot(start_time: str, user_id: str = Header(..., alias="X-User-Id")):
    supabase = get_supabase_client()
    key = _normalize_to_timestamp_no_tz(start_time)

    res = supabase.table(PRODUCT_TABLE).select("product_id", count="exact") \
        .eq("start_time", key).execute()

    if getattr(res, "error", None):
        raise HTTPException(500, detail="Slot check failed")
    taken = (res.count or 0) > 0
    return {"available": not taken}


@router.post("/products")
async def create_product(
    product_name: str = Form(...),
    product_desc: str | None = Form(None),
    product_cat_id: int = Form(...),
    start_price: float = Form(...),
    start_time: str = Form(...),
    end_time: str | None = Form(None),
    product_img1: UploadFile = File(...),
    product_img2: UploadFile = File(None),
    product_img3: UploadFile = File(None),
    product_img4: UploadFile = File(None),
    product_img5: UploadFile = File(None),
    user_id: str = Header(..., alias="X-User-Id"),
):
    supabase = get_supabase_client()
    product_id = str(uuid.uuid4())

    # --- 1) get verify_img from users ---
    user_q = supabase.table("users").select("verify_img").eq("user_id", user_id).single().execute()
    if getattr(user_q, "error", None):
        raise HTTPException(500, detail="Could not read user profile")
    verify_img = (user_q.data or {}).get("verify_img")
    is_verified = bool(verify_img) and str(verify_img).strip() not in {"", "NULL", "None"}
    status_id = 2 if is_verified else 1

    # --- 2) normalize time fields ---
    start_key = _normalize_to_timestamp_no_tz(start_time)
    if end_time:
        end_key = _normalize_to_timestamp_no_tz(end_time)
    else:
        dt_start = datetime.strptime(start_key, "%Y-%m-%d %H:%M:%S")
        end_key = (dt_start + timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S")

    # --- 3) duplicate guard ---
    dup = supabase.table(PRODUCT_TABLE).select("product_id", count="exact").eq("start_time", start_key).execute()
    if getattr(dup, "error", None):
        raise HTTPException(500, detail="Failed to validate slot")
    if (dup.count or 0) > 0:
        raise HTTPException(status_code=409, detail="A product with this start_time already exists")

    # --- 4) แปลงรูปเป็น hex string สำหรับ Supabase bytea ---
    def _to_hex(file: UploadFile | None):
        """แปลงไฟล์เป็น hex string สำหรับเก็บใน bytea column"""
        if not file:
            return None
        try:
            data = file.file.read()
            if not data:
                return None
            # ส่งเป็น hex string สำหรับ Supabase bytea
            return "\\x" + data.hex()
        except Exception as e:
            print(f"Error reading file: {e}")
            return None

    imgs = [
        _to_hex(product_img1),
        _to_hex(product_img2),
        _to_hex(product_img3),
        _to_hex(product_img4),
        _to_hex(product_img5)
    ]

    # --- 5) insert ---
    record = {
        "product_id": product_id,
        "product_name": product_name,
        "product_desc": product_desc,
        "product_cat_id": product_cat_id,
        "seller_id": user_id,
        "product_img": imgs[0],
        "product_img2": imgs[1],
        "product_img3": imgs[2],
        "product_img4": imgs[3],
        "product_img5": imgs[4],
        "start_price": start_price,
        "start_time": start_key,
        "end_time": end_key,
        "status_id": status_id,
    }

    ins = supabase.table(PRODUCT_TABLE).insert(record).execute()
    if getattr(ins, "error", None):
        raise HTTPException(status_code=500, detail=str(ins.error))

    return {"ok": True, "product_id": product_id, "message": "Product created successfully"}