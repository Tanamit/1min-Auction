from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.Service.db_connection import run_sql
from app.Service.ProfileAdmin import ProfileAdminService
from app.Controller.loginAccount.LoginAccountController import router as login_router  # ✅ เพิ่ม login router
from app.Controller.Home import WinnerHistoryController,CategoriesController,ExploreProductController, ComingUpController
from app.Service.ProfileAdmin import ProfileAdminService   # or user_service if renamed
from app.Controller.CreateAccount.CreateAccountController import router as create_account_router

# Seller side
from app.Controller.ProfileSeller.MycredentialController import router as mycred_router
from app.Controller.ProfileSeller.AddproductController import router as seller_product_router
from app.Controller.ProfileSeller.ProductListController import router as seller_product_list_router

# Public product APIs
from app.Controller.Product.ProductController import router as product_router

# Buyer side
from app.Controller.ProfileBuyer.MyProfileController import router as buyer_profile_router
from app.Controller.ProfileBuyer.OrdersController import router as orders_router
from app.Controller.ProfileBuyer.BuyerCredController import router as buyer_cred_router

# Password reset
from app.Controller.Passwordmanagement.ForgetPasswordController import router as forget_password_router
from app.Controller.Passwordmanagement.ResetPasswordController import router as reset_password_router
from app.Controller.Payment.PaymentController import router as payment_router



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://localhost:5173",         
        "https://auctionhub-frontend.onrender.com",
        "https://auctionhub-frontend-k03w.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "FastAPI + Supabase connected!"}

class SQLRequest(BaseModel):
    sql: str

@app.post("/query")
def query(sql_request: SQLRequest):
    try:
        print("Received SQL query:", sql_request.sql)
        rows = run_sql(sql_request.sql)
        return {"rows": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(ProfileAdminService.router)
app.include_router(WinnerHistoryController.router)
app.include_router(CategoriesController.router)
app.include_router(ExploreProductController.router)
app.include_router(ComingUpController.router)
app.include_router(login_router)  # ✅ เพิ่ม login endpoint
app.include_router(create_account_router)

# Seller APIs
app.include_router(mycred_router)
app.include_router(seller_product_router)
app.include_router(seller_product_list_router)

# Public Products
app.include_router(product_router)

# Buyer APIs
app.include_router(buyer_profile_router)
app.include_router(orders_router)
app.include_router(buyer_cred_router)

# Password Reset
app.include_router(forget_password_router)
app.include_router(reset_password_router)
app.include_router(payment_router)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
