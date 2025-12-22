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
            "input_data": input_data,                
            "predicted_subtype": r.predicted_subtype,
            "confidence": r.confidence,
            "probabilities": probabilities,        
            "created_at": r.created_at,
        })

    return result

@router.get("/{prediction_id}")
def get_single_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prediction = (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id)
        .filter(Prediction.user_id == current_user.id)
        .first()
    )

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # ---------- SAFE JSON PARSING ----------
    try:
        input_data = json.loads(prediction.input_data) if prediction.input_data else {}
    except Exception:
        input_data = {}

    try:
        probabilities = json.loads(prediction.probabilities) if prediction.probabilities else {}
    except Exception:
        probabilities = {}

    try:
        features_used = json.loads(prediction.features_used) if prediction.features_used else []
    except Exception:
        features_used = []

    try:
        shap_data = json.loads(prediction.shap) if prediction.shap else None
    except Exception:
        shap_data = None
    # --------------------------------------

    return {
        "id": prediction.id,
        "input_data": input_data,
        "predicted_subtype": prediction.predicted_subtype,
        "confidence": prediction.confidence,
        "probabilities": probabilities,
        "features_used": features_used,
        "shap": shap_data,
        "created_at": prediction.created_at,
    }