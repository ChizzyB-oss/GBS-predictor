import json
import os
from typing import Dict, Any

import joblib


MODELS_DIR = "models"


def load_preprocessing_and_model() -> Dict[str, Any]:
    model_path = os.path.join(MODELS_DIR, "best_gbs_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
    le_path = os.path.join(MODELS_DIR, "label_encoders.pkl")
    prep_info_path = os.path.join(MODELS_DIR, "preprocessing_info.json")
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    label_encoders = joblib.load(le_path)

    with open(prep_info_path, "r") as f:
        preprocessing_info = json.load(f)

    metrics = None
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)

    return {
        "model": model,
        "scaler": scaler,
        "label_encoders": label_encoders,
        "preprocessing_info": preprocessing_info,
        "metrics": metrics,
    }
