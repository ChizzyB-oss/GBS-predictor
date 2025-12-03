from sqlalchemy import Column, Integer, Boolean, String
from ..core.database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    maintenance_mode = Column(Boolean, default=False)
    allow_registration = Column(Boolean, default=True)
    model_version = Column(String, default="1.0")
