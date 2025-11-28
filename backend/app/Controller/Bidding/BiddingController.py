from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, condecimal
from datetime import datetime
from app.Model.Bidding.BiddingModel import BiddingModel

router = APIRouter(prefix="/bids", tags=["Bidding"])

# ======================================================
# FIXED CLOCK
# ======================================================
VIRTUAL_START = datetime(2025, 10, 21, 3, 0, 0)

def get_virtual_now() -> datetime:
    now = datetime.now()
    return VIRTUAL_START.replace(minute=now.minute, second=now.second, microsecond=0)


# ======================================================
# REQUEST MODEL
# ======================================================
class BidRequest(BaseModel):
    product_id: str
    bid_amount: condecimal(gt=0)


# ======================================================
# GET PRODUCT DETAILS
# ======================================================
@router.get("/product/{product_id}")
def get_product(product_id: str):
    product = BiddingModel.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product["virtual_now"] = get_virtual_now().strftime("%Y-%m-%d %H:%M:%S")
    return product


# ======================================================
# CREATE NEW BID
# ======================================================
@router.post("/create")
def create_bid(payload: BidRequest):
    product_id = payload.product_id

    # Temporary UUID since your user system is not ready
    bidder_id = "ce729402-fcac-4c62-868d-3d04800c5db7"

    result = BiddingModel.insert_bid(
        product_id=product_id,
        bidder_id=bidder_id,
        bid_amount=float(payload.bid_amount)
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return {
        "status": "success",
        "message": "Bid placed successfully",
        "new_price": result["new_price"],
        "data": result["bid"],
    }


# ======================================================
# GET ALL BIDS
# ======================================================
@router.get("/product/{product_id}/bids")
def get_all_bids(product_id: str):
    bids = BiddingModel.get_all_bids(product_id)
    return {"total_bids": len(bids), "bids": bids}


# ======================================================
# GET HIGHEST BID
# ======================================================
@router.get("/{product_id}/highest")
def get_highest_bid(product_id: str):
    highest = BiddingModel.get_highest_bid(product_id)
    start_price = BiddingModel.get_product_start_price(product_id)

    if not highest:
        return {"highest_bid": start_price, "message": "No bids yet."}

    return {
        "highest_bid": float(highest["bid_amount"]),
        "data": highest
    }


# ======================================================
# GET LATEST BID ID
# ======================================================
@router.get("/product/{product_id}/latest")
def get_latest_bid(product_id: str):
    bid_id = BiddingModel.get_latest_bid(product_id)
    return {"bid_id": bid_id}
