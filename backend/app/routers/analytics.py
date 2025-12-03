from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.auth_service import get_current_user
from ..models.prediction_model import Prediction
import json
from datetime import date

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get("/predictions-over-time")
def predictions_over_time(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    rows = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).all()

    counts = {}
    for r in rows:
        key = r.created_at.date().isoformat()
        counts[key] = counts.get(key, 0) + 1

    return counts


@router.get("/subtype-distribution")
def subtype_distribution(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    rows = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).all()

    dist = {}
    for r in rows:
        dist[r.predicted_subtype] = dist.get(r.predicted_subtype, 0) + 1

    return dist
