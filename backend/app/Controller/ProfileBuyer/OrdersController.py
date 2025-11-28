from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Header, Query, HTTPException

from app.Service.db_connection import get_supabase_client
from app.Model.ProfileBuyer.OrdersModel import OrderOut

router = APIRouter(prefix="/api/buyer", tags=["Orders"])


# -----------------------------------------------------
# Helper: Map status_id -> text
# -----------------------------------------------------
def _status_map(status_id: int):
    if status_id == 9:
        return "received"
    if status_id == 6:
        return "refunded"
    return "completed"


# -----------------------------------------------------
# Convert a raw product row into DTO
# -----------------------------------------------------
def _to_dto(row: dict) -> OrderOut:
    pid = str(row["product_id"])

    return OrderOut(
        id=pid,
        orderId="ORD-" + pid[:8].upper(),
        productId=pid,
        productName=row.get("product_name", ""),
        finalPrice=row.get("final_price"),
        purchasedAt=row.get("paid_at"),
        cancelledAt=row.get("cancelled_at"),
        thumbnailUrl=None,
        status=_status_map(row.get("status_id"))
    )


# -----------------------------------------------------
# GET /orders?status=completed|cancelled
# -----------------------------------------------------
@router.get("/orders", response_model=List[OrderOut])
def list_orders(
    status: str = Query("completed", regex="^(completed|cancelled)$"),
    x_user_id: str = Header(..., alias="X-User-Id")
):
    supabase = get_supabase_client()

    # Load base products
    product_resp = (
        supabase.table("product")
        .select("product_id, product_name, start_price, end_time, winner_id, status_id")
        .eq("winner_id", x_user_id)
        .execute()
    )
    rows = product_resp.data or []

    # filter by refund state
    if status == "completed":
        rows = [r for r in rows if r.get("status_id") != 6]
    else:
        rows = [r for r in rows if r.get("status_id") == 6]

    enriched = []

    for row in rows:
        pid = row["product_id"]
        final_price = None
        paid_at = None
        cancelled_at = None

        # ------- PAYMENT ENRICHMENT -------
        bid_resp = (
            supabase.table("bid")
            .select("bid_id")
            .eq("product_id", pid)
            .eq("bidder_id", x_user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        bids = bid_resp.data or []
        if bids:
            bid_id = bids[0]["bid_id"]

            pay_resp = (
                supabase.table("payment")
                .select("amount, payment_time")
                .eq("bid_id", bid_id)
                .order("payment_time", desc=True)
                .limit(1)
                .execute()
            )
            pays = pay_resp.data or []
            if pays:
                final_price = pays[0]["amount"]
                paid_at = pays[0]["payment_time"]

        # fallback
        if final_price is None:
            final_price = row.get("start_price")
        if paid_at is None:
            paid_at = row.get("end_time")

        # ------- DELIVERY (for refund) -------
        if row.get("status_id") == 6:
            d = (
                supabase.table("delivery")
                .select("received_date")
                .eq("product_id", pid)
                .eq("delivery_status", "Refund")
                .order("received_date", desc=True)
                .limit(1)
                .execute()
            )
            dd = d.data or []
            if dd:
                cancelled_at = dd[0]["received_date"]

        row["final_price"] = final_price
        row["paid_at"] = paid_at
        row["cancelled_at"] = cancelled_at

        enriched.append(row)

    return [_to_dto(r) for r in enriched]


# -----------------------------------------------------
# POST /orders/{product_id}/receive
# -----------------------------------------------------
@router.post("/orders/{product_id}/receive", response_model=OrderOut)
def receive_order(product_id: UUID, x_user_id: str = Header(..., alias="X-User-Id")):
    supabase = get_supabase_client()
    pid = str(product_id)

    # verify owner
    base = (
        supabase.table("product")
        .select("product_id, product_name, start_price, end_time, winner_id, status_id")
        .eq("product_id", pid)
        .single()
        .execute()
    )
    product = base.data
    if not product:
        raise HTTPException(404, "Not found")
    if product["winner_id"] != x_user_id:
        raise HTTPException(403, "Not your order")

    # update status delivered
    supabase.table("product").update({"status_id": 9}).eq("product_id", pid).execute()

    # insert delivery
    supabase.table("delivery").insert(
        {
            "receiver_id": x_user_id,
            "delivery_status": "Delivered",
            "received_date": datetime.utcnow().isoformat(),
            "product_id": pid,
        }
    ).execute()

    # return enriched object
    all_orders = list_orders(status="completed", x_user_id=x_user_id)
    for o in all_orders:
        if o.productId == pid:
            o.status = "received"
            return o

    return _to_dto(product)


# -----------------------------------------------------
# POST /orders/{product_id}/refund
# -----------------------------------------------------
@router.post("/orders/{product_id}/refund", response_model=OrderOut)
def refund_order(product_id: UUID, x_user_id: str = Header(..., alias="X-User-Id")):
    supabase = get_supabase_client()
    pid = str(product_id)

    base = (
        supabase.table("product")
        .select("product_id, product_name, start_price, end_time, winner_id, status_id")
        .eq("product_id", pid)
        .single()
        .execute()
    )
    product = base.data
    if not product:
        raise HTTPException(404, "Not found")
    if product["winner_id"] != x_user_id:
        raise HTTPException(403, "Not your order")

    supabase.table("product").update({"status_id": 6}).eq("product_id", pid).execute()

    supabase.table("delivery").insert(
        {
            "receiver_id": x_user_id,
            "delivery_status": "Refund",
            "received_date": datetime.utcnow().isoformat(),
            "product_id": pid,
        }
    ).execute()

    all_refund = list_orders(status="cancelled", x_user_id=x_user_id)
    for o in all_refund:
        if o.productId == pid:
            o.status = "refunded"
            return o

    return _to_dto(product)
