# backend/app/Model/Bidding/BiddingModel.py

from app.Service.db_connection import supabase
from uuid import uuid4
from datetime import datetime


class BiddingModel:

    # ======================================================
    # PRODUCT
    # ======================================================
    @staticmethod
    def get_product(product_id: str):
        res = (
            supabase.table("product")
            .select(
                "product_id, product_name, product_desc, product_img, product_cat_id, "
                "seller_id, start_price, start_time, end_time"
            )
            .eq("product_id", product_id)
            .limit(1)
            .execute()
        )
        data = res.data or []
        return data[0] if data else None

    @staticmethod
    def get_product_start_price(product_id: str) -> float:
        res = (
            supabase.table("product")
            .select("start_price")
            .eq("product_id", product_id)
            .limit(1)
            .execute()
        )
        data = res.data or []
        return float((data[0] or {}).get("start_price", 0)) if data else 0.0

    # ======================================================
    # BIDS
    # ======================================================
    @staticmethod
    def get_highest_bid(product_id: str):
        res = (
            supabase.table("bid")
            .select("bid_id, bidder_id, bid_amount, created_at")
            .eq("product_id", product_id)
            .order("bid_amount", desc=True)
            .limit(1)
            .execute()
        )
        data = res.data or []
        return data[0] if data else None

    @staticmethod
    def get_latest_bid(product_id: str):
        res = (
            supabase.table("bid")
            .select("bid_id")
            .eq("product_id", product_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        data = res.data or []
        return (data[0] or {}).get("bid_id") if data else None

    @staticmethod
    def get_all_bids(product_id: str):
        res = (
            supabase.table("bid")
            .select("bid_id, bidder_id, bid_amount, created_at")
            .eq("product_id", product_id)
            .order("bid_amount", desc=True)
            .execute()
        )
        return res.data or []

    # ======================================================
    # INSERT BID (WITH VALIDATION + UPDATE PRODUCT CURRENT PRICE)
    # ======================================================
    @staticmethod
    def insert_bid(product_id: str, bidder_id: str, bid_amount: float):

        # 1️⃣ Validate product exists
        product = BiddingModel.get_product(product_id)
        if not product:
            return {"error": "Product not found"}

        # 2️⃣ Get highest current bid
        highest = BiddingModel.get_highest_bid(product_id)
        current_price = highest["bid_amount"] if highest else product["start_price"]

        # 3️⃣ Reject invalid bid
        if bid_amount <= current_price:
            return {"error": f"Bid too low. Must be > {current_price}"}

        # 4️⃣ Insert bid
        bid_id = str(uuid4())
        payload = {
            "bid_id": bid_id,
            "product_id": product_id,
            "bidder_id": bidder_id,
            "bid_amount": bid_amount,
        }

        supabase.table("bid").insert(payload).execute()

        # 5️⃣ Update product current_price
        supabase.table("product").update(
            {"start_price": bid_amount}
        ).eq("product_id", product_id).execute()

        return {
            "status": "success",
            "message": "Bid placed successfully",
            "bid": payload,
            "new_price": bid_amount,
        }
