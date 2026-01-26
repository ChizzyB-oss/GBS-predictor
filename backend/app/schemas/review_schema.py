from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewRequestCreate(BaseModel):
    recipient_id: int
    prediction_id: int
    note: Optional[str] = None

class ReviewRequestOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    prediction_id: int
    note: Optional[str] = None
    status: str
    created_at: datetime

    # Extra display fields for UI convenience (optional)
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    predicted_subtype: Optional[str] = None
    confidence: Optional[float] = None

class ReviewStatusUpdate(BaseModel):
    status: str  # "pending" | "viewed" | "resolved"
