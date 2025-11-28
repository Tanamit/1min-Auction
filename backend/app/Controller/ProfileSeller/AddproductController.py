import uuid
import base64
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from app.Service.db_connection import get_supabase_client

router = APIRouter(prefix="/api/seller", tags=["Product"])

CATEGORY_TABLE = "category"
PRODUCT_TABLE = "product"


def _b64(file: UploadFile | None):
    # NOTE: Supabase BYTEA expects raw bytes; if your previous insert
    # worked with base64 strings, keep it. Otherwise decode before insert.
    # Here we keep base64 like your original.
    if not file:
        return None
    data = file.file.read()
    return base64.b64encode(data).decode("utf-8")


def _normalize_to_timestamp_no_tz(iso_str: str) -> str:
    """
    Convert e.g. '2025-10-21T03:31:00+07:00' -> '2025-10-20 20:31:00'
    (UTC naive string) to match a Postgres `timestamp` (no tz) column.

    If your `start_time` column is TIMESTAMP WITHOUT TIME ZONE,
    the safest way to compare is to store UTC as naive.
    """
    try:
        dt = datetime.fromisoformat(iso_str)  # aware if offset present
    except Exception:
        raise HTTPException(400, detail="Invalid start_time format (must be ISO 8601)")

    if dt.tzinfo is None:
        # treat naive as local; convert to UTC for consistency
        dt = dt.replace(tzinfo=timezone.utc)
    utc_naive = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return utc_naive.strftime("%Y-%m-%d %H:%M:%S")


@router.get("/categories")
def get_categories():
    supabase = get_supabase_client()
    res = supabase.table(CATEGORY_TABLE).select("category_id, category_name").order("category_id").execute()
    if getattr(res, "error", None):
        raise HTTPException(status_code=500, detail=str(res.error))
    return res.data


# GET /api/seller/products/check-slot?start_time=2025-10-21T03:31:00+07:00
@router.get("/products/check-slot")
def check_slot(start_time: str, user_id: str = Header(..., alias="X-User-Id")):
    supabase = get_supabase_client()
    key = _normalize_to_timestamp_no_tz(start_time)  # UTC-naive string

    # equality on timestamp without tz; Supabase filter takes the literal
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
    product_cat_id: int = Form(...),   # kept from client; see note below
    start_price: float = Form(...),

    # time (client sends ISO with offset)
    start_time: str = Form(...),
    end_time: str | None = Form(None),

    # images
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

    # decide status_id based on verify_img
    status_id = 2 if is_verified else 1

    # --- 2) normalize time fields for TIMESTAMP (no tz) columns ---
    start_key = _normalize_to_timestamp_no_tz(start_time)
    if end_time:
        end_key = _normalize_to_timestamp_no_tz(end_time)
    else:
        dt_start = datetime.strptime(start_key, "%Y-%m-%d %H:%M:%S")
        end_key = (dt_start + timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S")

    # --- 3) duplicate guard (API) ---
    dup = supabase.table(PRODUCT_TABLE).select("product_id", count="exact").eq("start_time", start_key).execute()
    if getattr(dup, "error", None):
        raise HTTPException(500, detail="Failed to validate slot")
    if (dup.count or 0) > 0:
        raise HTTPException(status_code=409, detail="A product with this start_time already exists")

    # --- 4) images as base64 (same as your earlier code) ---
    def _b64_sync(file: UploadFile | None):
        if not file:
            return None
        data = file.file.read()
        return base64.b64encode(data).decode("utf-8")

    imgs = [_b64_sync(product_img1), _b64_sync(product_img2), _b64_sync(product_img3), _b64_sync(product_img4), _b64_sync(product_img5)]

    # --- 5) insert ---
    record = {
        "product_id": product_id,
        "product_name": product_name,
        "product_desc": product_desc,
        "product_cat_id": product_cat_id,  # ← if you meant "cat" = category override, set this to (2 if is_verified else 1)
        "seller_id": user_id,
        "product_img":  imgs[0],
        "product_img2": imgs[1],
        "product_img3": imgs[2],
        "product_img4": imgs[3],
        "product_img5": imgs[4],
        "start_price": start_price,
        "start_time": start_key,
        "end_time": end_key,
        "status_id": status_id,            # ← “cat” mapped to status here
    }

    ins = supabase.table(PRODUCT_TABLE).insert(record).execute()
    if getattr(ins, "error", None):
        raise HTTPException(status_code=500, detail=str(ins.error))

    return {"ok": True, "product_id": product_id, "message": "Product created successfully"}
