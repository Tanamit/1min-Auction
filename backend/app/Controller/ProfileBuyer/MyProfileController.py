from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from Model.ProfileBuyer.MyProfileModel import update_buyer_profile

router = APIRouter(
    prefix="/api/buyer",
    tags=["buyer_profile"]
)

# Define the request body schema
class BuyerProfileUpdateRequest(BaseModel):
    user_id: str
    user_email: EmailStr
    user_name: str
    first_name: str
    last_name: str
    address: str
    create_date: str | None = None
    verify_img: str | None = None


@router.put("/{user_id}")
async def update_profile(user_id: str, body: BuyerProfileUpdateRequest):
    """
    Updates an existing buyer profile in the database.
    """
    try:
        # 1. Validate user_id consistency
        if user_id != body.user_id:
            raise HTTPException(status_code=400, detail="User ID mismatch between path and body.")

        # 2. Call the Model layer to handle DB logic
        result = update_buyer_profile(
            user_id=body.user_id,
            user_email=body.user_email,
            user_name=body.user_name,
            first_name=body.first_name,
            last_name=body.last_name,
            address=body.address,
            create_date=body.create_date,
            verify_img=body.verify_img
        )

        # 3. Return appropriate response
        if result["status"] == "success":
            return {
                "message": "Profile updated successfully.",
                "user": result["user"]
            }
        elif result["status"] == "not_found":
            raise HTTPException(status_code=404, detail="User not found.")
        else:
            raise HTTPException(status_code=500, detail=result["message"])

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Controller error while updating profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while updating profile.")
