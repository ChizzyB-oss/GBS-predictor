from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ReviewRequestCreate(BaseModel):
    recipient_id: int
    prediction_id: int
    note: Optional[str] = None


class ReviewRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    recipient_id: int
    prediction_id: int
    note: Optional[str] = None
    status: str
    created_at: datetime

    # ---- Display fields (Inbox) ----
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None

    # ---- Display fields (Sent tab / Outbox) ----
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None

    # ---- Prediction snapshot ----
    predicted_subtype: Optional[str] = None
    confidence: Optional[float] = None

    # ---- Feedback (Step 3) ----
    feedback: Optional[str] = None
    feedback_at: Optional[datetime] = None
    sender_seen: Optional[bool] = True


class ReviewStatusUpdate(BaseModel):
    status: str  # "pending" | "viewed" | "resolved"


class ReviewFeedbackUpdate(BaseModel):
    feedback: str
