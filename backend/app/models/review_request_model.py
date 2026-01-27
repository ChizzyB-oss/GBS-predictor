from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from datetime import datetime
from ..core.database import Base

class ReviewRequest(Base):
    __tablename__ = "review_requests"

    id = Column(Integer, primary_key=True, index=True)

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)

    note = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending/viewed/resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ NEW: reviewer feedback (recipient writes this)
    feedback = Column(Text, nullable=True)
    feedback_at = Column(DateTime, nullable=True)

    # ✅ NEW: sender notification flag (sender hasn't seen feedback yet)
    sender_seen = Column(Boolean, default=True)  # True means "no new feedback"