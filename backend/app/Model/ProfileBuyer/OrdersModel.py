from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class OrderOut(BaseModel):
    id: str
    orderId: str
    productId: str
    productName: str

    finalPrice: Optional[float] = None
    quantity: int = 1

    purchasedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None

    thumbnailUrl: Optional[str] = None

    # completed | received | refunded
    status: str = "completed"
