from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from Model.CreateAccount.CreateAccountModel import create_new_user

# Define the data structure for the incoming request body
class SignUpRequest(BaseModel):
    first_name: str
    last_name: str  
    address: str
    username: str
    email: EmailStr
    password: str

# Create an APIRouter instance
router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

@router.post("/register")
async def register_user(request_body: SignUpRequest):
    """
    Handles the POST request to register a new user account.
    """
    try:
        # 1. Basic validation
        if len(request_body.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
            
        # 2. Call the Model to handle the database logic
        result = create_new_user(
            username=request_body.username,
            email=request_body.email,
            password=request_body.password,
            # Correctly accessing attributes using snake_case
            first_name=request_body.first_name, 
            last_name=request_body.last_name,
            address=request_body.address
        )

        # 3. Process the result from the Model
        if result["status"] == "success":
            return {"message": "Account created successfully", "user_id": result.get("user_id")}
        
        elif result["status"] == "error" and "already exists" in result["message"]:
            raise HTTPException(status_code=409, detail=result["message"])
            
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Controller Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during account creation.")
# End of CreateAccountController.py
