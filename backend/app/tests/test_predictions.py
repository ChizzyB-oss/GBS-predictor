from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.app.main import app

client = TestClient(app)


def test_prediction_endpoint_returns_valid_response():
    fake_response = {
        "predicted_subtype": "AIDP",
        "confidence": 0.92,
        "probabilities": {
            "AIDP": 0.92,
            "AMAN": 0.04,
            "AMSAN": 0.02,
            "MFS": 0.02
        },
        "features_used": ["age", "csf_protein"],
        "shap": None
    }

    payload = {
        "age": 45,
        "gender": "male",
        "previous_infection": "respiratory",
        "onset_speed": "acute",
        "motor_velocity": 50,
        "sensory_velocity": 35,
        "amplitude": 3.2,
        "f_wave_latency": 28,
        "csf_protein": 120,
        "muscle_weakness": 1,
        "paralysis": 0,
        "sensory_loss": 1,
        "reflex_loss": 1,
        "respiratory_involvement": 0,
        "cranial_nerve_involvement": 0,
        "conduction_block": 0
    }

    with patch(
        "backend.app.services.prediction_service.predict_subtype",
        return_value=fake_response
    ):
        response = client.post("/api/predictions/predict", json=payload)

    assert response.status_code == 200

    data = response.json()
    assert data["predicted_subtype"] == "AIDP"
    assert 0 <= data["confidence"] <= 1
    assert "probabilities" in data
