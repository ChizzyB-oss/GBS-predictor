from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime

from ..core.database import Base

class ReviewRequest(Base):
    __tablename__ = "review_requests"

    id = Column(Integer, primary_key=True, index=True)

    # Who sent / who receives
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Which prediction is being reviewed
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False, index=True)

    # Optional note
    note = Column(Text, nullable=True)

    # Workflow status
    status = Column(String(20), default="pending", nullable=False)  # pending | viewed | resolved

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
