from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import uuid

router = APIRouter()  # ← สำคัญมาก! บรรทัดนี้หายไป

@router.post("/payment/create")
async def create_payment(
    product_id: str = Form(...),
    user_id: str = Form(...),
    amount: float = Form(...),
    address: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    payment_slip: UploadFile = File(...),
    payment_status: str = Form(default="pending")
):
    try:
        from app.Service.db_connection import get_supabase_client
        
        supabase = get_supabase_client()
        
        # Validate file type
        if not payment_slip.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        slip_bytes = await payment_slip.read()
        slip_hex = "\\x" + slip_bytes.hex()
        payment_id = str(int(datetime.now().timestamp() * 1000))
        
        print(f"Creating payment for user: {user_id}, product: {product_id}")
        
        # 1. Insert payment
        payment_result = supabase.table("payment").insert({
            "payment_id": payment_id,
            "amount": amount,
            "address": address,
            "payment_slip": slip_hex,
            "payment_status": payment_status
        }).execute()
        
        if not payment_result.data:
            raise HTTPException(status_code=500, detail="Failed to insert payment record")
        
        # 2. Update product status
        product_update = supabase.table("product")\
            .update({"status_id": 4})\
            .eq("product_id", product_id)\
            .execute()
        
        if not product_update.data:
            print(f"Warning: Failed to update product status for {product_id}")
        
        # 3. Create Invoice
        invoice_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        invoice_result = supabase.table("invoice").insert({
            "invoice_id": invoice_id,
            "payment_id": payment_id,
            "invoice_date": current_time,
            "total_amount": amount,
            "create_at": current_time,
        }).execute()
        
        if not invoice_result.data:
            print(f"Warning: Failed to create invoice for payment {payment_id}")
        
        return JSONResponse({
            "success": True,
            "message": "Payment submitted successfully",
            "payment_id": payment_id,
            "invoice_id": invoice_id,
            "data": payment_result.data[0]
        })
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Payment creation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Payment submission failed: {str(e)}"
        )


@router.get("/payment/{payment_id}")
async def get_payment(payment_id: str):
    try:
        from app.Service.db_connection import get_supabase_client
        supabase = get_supabase_client()
        
        result = supabase.table("payment")\
            .select("*")\
            .eq("payment_id", payment_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return JSONResponse({
            "success": True,
            "data": result.data[0]
        })
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment: {str(e)}")


@router.get("/invoice/{invoice_id}")
async def get_invoice(invoice_id: str):
    try:
        from app.Service.db_connection import get_supabase_client
        supabase = get_supabase_client()
        
        result = supabase.table("invoice")\
            .select("*")\
            .eq("invoice_id", invoice_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return JSONResponse({
            "success": True,
            "data": result.data[0]
        })
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoice: {str(e)}")


@router.patch("/payment/{payment_id}/status")
async def update_payment_status(payment_id: str, status: str = Form(...)):
    try:
        from app.Service.db_connection import get_supabase_client
        supabase = get_supabase_client()
        
        valid_statuses = ["pending", "paid", "rejected", "refunded"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        result = supabase.table("payment")\
            .update({"payment_status": status})\
            .eq("payment_id", payment_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return JSONResponse({
            "success": True,
            "message": f"Payment status updated to {status}",
            "data": result.data[0]
        })
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update payment status: {str(e)}")