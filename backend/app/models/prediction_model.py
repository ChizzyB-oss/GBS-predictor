from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from ..core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    input_data = Column(Text, nullable=False)  # JSON string
    predicted_subtype = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    ci_lower = Column(Float, nullable=True)
    ci_upper = Column(Float, nullable=True)
    probabilities = Column(Text, nullable=False)  # JSON string
    features_used = Column(Text, nullable=True)
    shap = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
