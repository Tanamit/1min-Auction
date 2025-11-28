# backend/app/Controller/ProductController.py

from fastapi import APIRouter
from datetime import datetime, timedelta
import traceback
from fastapi import HTTPException
from app.Service.db_connection import supabase
from datetime import datetime, timedelta

router = APIRouter(prefix="/products", tags=["Products"])


def get_now() -> datetime:
    """
    Return current real time (Adjusted to Thai Time UTC+7)
    """
    # ดึงเวลาปัจจุบันแบบ UTC (เวลาโลก)
    utc_now = datetime.utcnow()
    # บวก 7 ชั่วโมงเพื่อให้เป็นเวลาไทย
    thai_now = utc_now + timedelta(hours=7)
    # ตัดหน่วยไมโครวินาทีออกเพื่อให้ Format ตรงกับ DB
    return thai_now.replace(microsecond=0)


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
    Return upcoming products that haven't started yet.
    """
    now = get_now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    
    res = (
        supabase.table("product")
        .select(
            "product_id, product_name, product_desc, product_img, "
            "start_price, seller_id, start_time, end_time, product_cat_id, status_id"
        )
        .gte("start_time", now_str)  # start_time >= now
        .in_("status_id", [2])  # Only verified products
        .order("start_time", desc=False)
        .limit(limit)
        .execute()
    )

    products = res.data or []

    items = []
    for prod in products:
        items.append({
            "product_id": prod.get("product_id"),
            "product_name": prod.get("product_name"),
            "product_desc": prod.get("product_desc"),
            "product_img": prod.get("product_img"),
            "start_price": prod.get("start_price"),
            "seller_id": prod.get("seller_id"),
            "product_cat_id": prod.get("product_cat_id"),
            "start_time": prod.get("start_time"),
            "end_time": prod.get("end_time"),
            "status_id": prod.get("status_id"),
        })

    return {
        "current_time": now_str,
        "items": items,
    }


# ======================================================
# ✅ CURRENTLY BIDDING PRODUCT
# ======================================================
# backend/app/Controller/ProductController.py

@router.get("/bidding-now")
def get_bidding_now():
    """
    1. Check if any upcoming product (status=2) has reached start_time.
    2. If yes, update status to 8 (Bidding).
    3. Return the current bidding product.
    """
    now = get_now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # Debug: ปริ้นดูเวลา Server ใน Terminal (จะได้รู้ว่าเวลาตรงไหม)
    print(f"🕒 Server Time (Thai): {now_str}")

    # -------------------------------------------------------
    # 🔥 STEP 1: Auto-Promote (Trigger เปลี่ยนสถานะอัตโนมัติ)
    # -------------------------------------------------------
    # หาสินค้าที่ถึงเวลาเริ่มแล้ว (start_time <= now) และสถานะเป็น 2
    # ❌ เอา .gte("end_time", now_str) ออก เพื่อกันพลาดกรณีเวลาเหลื่อม
    to_promote = (
        supabase.table("product")
        .select("product_id, start_time")
        .lte("start_time", now_str)   # ถึงเวลาเริ่มแล้ว
        .eq("status_id", 2)           # แต่สถานะยังเป็น 2
        .execute()
    )
    
    # ถ้าเจอสินค้าที่ต้องเริ่มประมูล ให้เปลี่ยนสถานะเป็น 8 ทันที
    if to_promote.data:
        for item in to_promote.data:
            print(f"⚡ Promoting Product: {item['product_id']} (Start: {item['start_time']})")
            supabase.table("product").update({"status_id": 8}).eq("product_id", item['product_id']).execute()

    # -------------------------------------------------------
    # 🔥 STEP 2: Fetch Active Product (ดึงข้อมูลตามปกติ)
    # -------------------------------------------------------
    # ขั้นตอนนี้ยังต้องเช็ค end_time เพื่อไม่ให้เอาของที่จบไปแล้วมาโชว์
    res = (
        supabase.table("product")
        .select(
            "product_id, product_name, product_desc, product_img, "
            "start_price, seller_id, start_time, end_time, status_id"
        )
        .lte("start_time", now_str)  # เริ่มไปแล้ว
        .gte("end_time", now_str)    # ยังไม่จบ
        .eq("status_id", 8)          # สถานะต้องเป็น 8
        .order("start_time", desc=False) # เอาอันที่เริ่มก่อนมาโชว์
        .limit(1)
        .execute()
    )

    data = res.data or []
    bidding_product = data[0] if data else None
    
    # คำนวณเวลาที่เหลือ
    time_remaining = None
    if bidding_product and bidding_product.get("end_time"):
        try:
            # แปลง end_time ใน DB เป็น datetime object
            end_time = datetime.strptime(bidding_product["end_time"], "%Y-%m-%d %H:%M:%S")
            # หาผลต่าง
            remaining = (end_time - now).total_seconds()
            time_remaining = max(0, int(remaining))
        except Exception as e:
            print(f"⚠️ Time calc error: {e}")
            pass

    return {
        "current_time": now_str,
        "bidding_now": bidding_product,
        "time_remaining_seconds": time_remaining,
    }


# ======================================================
# ✅ GET CURRENT TIME ENDPOINT
# ======================================================
@router.get("/time/current")
def get_current_time():
    """
    Returns current server time for frontend sync.
    """
    now = datetime.now()

    return {
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "hour": now.hour,
        "minute": now.minute,
        "seconds": now.second,
    }


# ======================================================
# ✅ FINALIZE AUCTION - หาผู้ชนะเมื่อหมดเวลา
# ======================================================
@router.post("/finalize/{product_id}")
def finalize_auction(product_id: str):
    """
    Finalize auction safely.
    Handles potential errors and checks for correct column names.
    """
    try:
        print(f"🏁 [Finalize] Processing product: {product_id}")

        # 1. ดึงข้อมูล product (ใช้ limit(1) แทน single เพื่อกัน Error 500)
        prod_res = (
            supabase.table("product")
            .select("*")
            .eq("product_id", product_id)
            .limit(1)
            .execute()
        )
        
        # เช็คว่าเจอสินค้าไหม
        if not prod_res.data:
            print(f"❌ Product {product_id} not found")
            return {"message": "Product not found", "product_id": product_id}
        
        product = prod_res.data[0]
        
        # ถ้า status เป็น 4 แล้ว (จบไปแล้ว) ไม่ต้องทำอะไร
        if product.get("status_id") == 4:
            print(f"⚠️ Product {product_id} is already finalized.")
            return {
                "message": "Auction already finalized",
                "product_id": product_id,
                "winner_id": product.get("winner_id"),
                "final_price": product.get("final_price")
            }
        
        # 2. หา bid สูงสุด
        bid_res = (
            supabase.table("bid")
            .select("*")
            .eq("product_id", product_id)
            .order("bid_amount", desc=True)
            .limit(1)
            .execute()
        )
        
        bids = bid_res.data or []
        
        if bids:
            # --- มีคนประมูล ---
            highest_bid = bids[0]
            print(f"💰 Highest bid found: {highest_bid}")

            # 🔥 จุดสำคัญ: เช็คทั้ง user_id หรือ bidder_id (เผื่อชื่อคอลัมน์ไม่ตรง)
            winner_id = highest_bid.get("user_id") or highest_bid.get("bidder_id")
            final_price = highest_bid.get("bid_amount")

            if not winner_id:
                # ถ้าหา ID ไม่เจอ แสดงว่า Column ใน DB ชื่อไม่ตรงกับ code
                print("❌ Error: Bid found but could not identify user_id/bidder_id column.")
                raise HTTPException(status_code=500, detail="Database column mismatch for bidder ID")

            # 3. อัพเดท product (Set Winner)
            supabase.table("product").update({
                "status_id": 4,
                "winner_id": winner_id,
                "final_price": final_price
            }).eq("product_id", product_id).execute()
            
            print(f"✅ Auction Won by {winner_id} at {final_price}")
            
            return {
                "message": "Auction finalized with winner",
                "product_id": product_id,
                "winner_id": winner_id,
                "final_price": final_price
            }
        else:
            # --- ไม่มีคนประมูล ---
            print("tel: No bids found. Closing auction.")
            
            supabase.table("product").update({
                "status_id": 4,
                "winner_id": None,
                "final_price": product.get("start_price") # หรือ None แล้วแต่ Logic
            }).eq("product_id", product_id).execute()
            
            return {
                "message": "Auction finalized with no winner",
                "product_id": product_id,
                "winner_id": None,
                "final_price": None
            }

    except Exception as e:
        # 🔥 ปริ้น Error ยาวๆ ออกมาดูใน Terminal ถ้ามันพัง
        print("🔥 CRITICAL ERROR in finalize_auction 🔥")
        print(traceback.format_exc()) 
        # ส่ง 500 กลับไปพร้อมข้อความ Error
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")


# ======================================================
# ✅ NEXT REFRESH ENDPOINT
# ======================================================
@router.get("/time/next-refresh")
def get_next_refresh():
    """
    Returns how many seconds remain until the next minute.
    """
    now = datetime.now()
    seconds_until_next_min = 60 - now.second
    next_minute = (now + timedelta(minutes=1)).replace(second=0, microsecond=0)

    return {
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "next_refresh_at": next_minute.strftime("%Y-%m-%d %H:%M:%S"),
        "seconds_left": seconds_until_next_min
    }


# ======================================================
# ✅ GET WINNER PRODUCTS
# ======================================================
@router.get("/winners")
def list_winners(limit: int = 20):
    """
    Get products that have been sold (status_id = 4).
    """
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
# ✅ UPDATE PRODUCT STATUS
# ======================================================
@router.put("/status/{product_id}")
def update_status(product_id: str, target: int = 8):
    """
    Update product.status_id to target.
    - 2 -> 8: Start bidding
    - 8 -> 4: End bidding (completed)
    """
    allowed = {2, 4, 8}
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

    # Promote 2 -> 8 (start bidding)
    if old_status == 2 and target == 8:
        updated = (
            supabase.table("product")
            .update({"status_id": 8})
            .eq("product_id", product_id)
            .eq("status_id", 2)
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
            "message": "Started bidding (2 -> 8)"
        }

    # End bidding 8 -> 4 (completed)
    if old_status == 8 and target == 4:
        updated = (
            supabase.table("product")
            .update({"status_id": 4})
            .eq("product_id", product_id)
            .eq("status_id", 8)
            .execute()
        )
        if getattr(updated, "error", None) or not updated.data:
            return {"updated": None, "message": "Update failed or already changed"}
        row = updated.data[0]
        return {
            "updated": {
                "product_id": row.get("product_id"),
                "old_status_id": old_status,
                "new_status_id": row.get("status_id"),
            },
            "message": "Bidding completed (8 -> 4)"
        }

    return {
        "updated": {
            "product_id": product_id,
            "old_status_id": old_status,
            "new_status_id": old_status,
        },
        "message": "No change"
    }