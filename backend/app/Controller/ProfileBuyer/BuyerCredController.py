import hashlib
import base64
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header, status, UploadFile, File
from app.Model.ProfileBuyer.BuyerCredModel import PasswordChangeIn
from app.Service.db_connection import get_supabase_client

router = APIRouter(prefix="/api/buyer/credential", tags=["myCredential"])

def md5_hash(password: str) -> str:
    return hashlib.md5(password.encode("utf-8")).hexdigest()

@router.put("/password")
def change_password(
    body: PasswordChangeIn,
    user_id: str = Header(..., alias="X-User-Id"),  # TEMP until JWT
):
    supabase = get_supabase_client()

    # 1) Fetch current hash
    resp = (
        supabase.table("users")
        .select("password")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if getattr(resp, "error", None):
        raise HTTPException(status_code=500, detail=str(resp.error))
    if not resp.data:
        raise HTTPException(status_code=404, detail="User not found")

    current_hash = (resp.data or {}).get("password") or ""

    # 2) Verify current password
    if md5_hash(body.current_password) != current_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # 3) Update with MD5 (matches your create-user logic)
    new_hash = md5_hash(body.new_password)
    now_iso = datetime.now(timezone.utc).isoformat()

    upd = (
        supabase.table("users")
        .update({"password": new_hash, "update_at": now_iso})
        .eq("user_id", user_id)
        .execute()
    )
    if getattr(upd, "error", None):
        raise HTTPException(status_code=500, detail=str(upd.error))

    return {"ok": True, "message": "Password updated"}

@router.put("/verify-image")
async def upload_verify_image(
    file: UploadFile = File(...),
    user_id: str = Header(..., alias="X-User-Id"),
):
    """
    Accepts an image and stores it in users.verify_img (BYTEA).
    We send base64 in JSON; PostgREST decodes to BYTEA.
    """
    supabase = get_supabase_client()

    # Basic validations
    if file.content_type not in ("image/png", "image/jpeg"):
        raise HTTPException(status_code=400, detail="Only PNG or JPG is allowed")

    data = await file.read()
    MAX = 2 * 1024 * 1024  # 2MB
    if len(data) > MAX:
        raise HTTPException(status_code=400, detail="File too large (max 2MB)")

    # base64 encode for bytea via JSON
    b64 = base64.b64encode(data).decode("utf-8")

    upd = (
        supabase.table("users")
        .update({"verify_img": b64})
        .eq("user_id", user_id)
        .execute()
    )

    if getattr(upd, "error", None):
        raise HTTPException(status_code=500, detail=str(upd.error))

    return {"ok": True, "message": "Verify image uploaded"}
