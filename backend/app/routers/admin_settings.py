from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.auth_service import require_admin
from ..models.settings_model import SystemSettings

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])

@router.get("/")
def get_settings(db: Session = Depends(get_db), admin=Depends(require_admin)):
    settings = db.query(SystemSettings).first()
    return settings

@router.put("/")
def update_settings(payload: dict, db: Session = Depends(get_db), admin=Depends(require_admin)):
    settings = db.query(SystemSettings).first()
    for key, value in payload.items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
