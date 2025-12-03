from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.auth_service import get_current_user
from ..models.prediction_model import Prediction
from ..models.user_model import User
import json

router = APIRouter(
    prefix="/prediction",
    tags=["Prediction History"]
)


@router.get("/history")
def get_my_prediction_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    result = []

    for r in rows:
        # Parse JSON fields safely
        try:
            input_data = json.loads(r.input_data) if r.input_data else {}
        except:
            input_data = {}

        try:
            probabilities = json.loads(r.probabilities) if r.probabilities else {}
        except:
            probabilities = {}

        result.append({
            "id": r.id,
            "input_data": input_data,                 # FIXED — now returns an object!
            "predicted_subtype": r.predicted_subtype,
            "confidence": r.confidence,
            "probabilities": probabilities,           # FIXED — parsed JSON
            "created_at": r.created_at,
        })

    return result
