from pydantic import BaseModel
from typing import Optional

class CategoryOut(BaseModel):
    category_id: int
    category_name: str

class ProductOut(BaseModel):
    product_id: str
    product_name: str
    product_desc: Optional[str] = None
    product_cat_id: int
    seller_id: str
    start_price: float
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status_id: Optional[int] = None
    # images as base64 strings when returning via API
    product_img: Optional[str] = None
    product_img2: Optional[str] = None
    product_img3: Optional[str] = None
    product_img4: Optional[str] = None
    product_img5: Optional[str] = None

