from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json
from datetime import datetime
from typing import Any, Dict

from ..schemas.prediction_schema import GBSPredictionInput
from ..services.prediction_service import predict_subtype
from ..services.auth_service import get_current_user
from ..core.database import get_db
from ..models.prediction_model import Prediction

router = APIRouter(tags=["Prediction"])


@router.post("/predict")
def predict_gbs_subtype(
    payload: GBSPredictionInput,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """
    Run a GBS subtype prediction, persist it, and return a JSON-safe result.

    Response shape (example):
    {
        "predicted_subtype": "AIDP",
        "confidence": 0.92,
        "probabilities": { "AIDP": 0.92, "AMAN": 0.03, ... },
        "features_used": ["age", "csf_protein", ...],
        "shap": {
            "predicted_class": "AIDP",
            "shap_values": { "age": 0.12, "csf_protein": 0.08, ... },
            "base_value": 0.25,
            "ranked_importance": [["age", 0.12], ...]
        },
        "id": 17,
        "created_at": "2025-12-02T06:45:13.123456"
    }
    """
    try:
        # 1) Run model prediction (already returns Python-native types)
        result: Dict[str, Any] = predict_subtype(payload)

        # Make sure required keys exist to avoid KeyError
        predicted_subtype = str(result.get("predicted_subtype"))
        confidence = float(result.get("confidence", 0.0))
        probabilities = result.get("probabilities", {})
        features_used = result.get("features_used", [])
        shap = result.get("shap")  # may be None

        # 2) Persist to DB (no SHAP column yet, so we only store core fields)
        pred_row = Prediction(
            user_id=current_user.id,
            input_data=json.dumps(payload.model_dump()),
            predicted_subtype=predicted_subtype,
            confidence=confidence,
            probabilities=json.dumps(probabilities),
            created_at=datetime.utcnow(),
        )
        db.add(pred_row)
        db.commit()
        db.refresh(pred_row)

        # 3) Build clean response for frontend
        response: Dict[str, Any] = {
            "predicted_subtype": predicted_subtype,
            "confidence": confidence,
            "probabilities": probabilities,
            "features_used": features_used,
            # Attach SHAP block if present (already JSON-safe from prediction_service)
            "shap": shap,
            # Extra metadata for frontend / reports
            "id": pred_row.id,
            "created_at": pred_row.created_at.isoformat() if pred_row.created_at else None,
        }

        return response

    except Exception as e:
        # Centralised error for FastAPI
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
