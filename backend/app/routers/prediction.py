from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json
from datetime import datetime
from typing import Any

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
    current_user: Any = Depends(get_current_user)
):
    try:
        result = predict_subtype(payload)

        pred_row = Prediction(
            user_id=current_user.id,
            input_data=json.dumps(payload.model_dump()),
            predicted_subtype=result["predicted_subtype"],
            confidence=result["confidence"],
            probabilities=json.dumps(result["probabilities"]),
            created_at=datetime.utcnow(),
        )
        db.add(pred_row)
        db.commit()

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
