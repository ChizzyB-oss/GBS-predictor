from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Basic login fields
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)

    # Clinician/Admin role
    role = Column(String(50), default="clinician", nullable=False)  # "admin" or "clinician"

    # Security
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

    # Profile-specific fields (new)
    hospital = Column(String(255), nullable=True)
    specialty = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
