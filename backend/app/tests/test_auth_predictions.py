from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_prediction_endpoint_requires_authentication():
    """
    Test that prediction endpoint rejects unauthenticated requests
    when provided with a VALID payload.
    """

    valid_payload = {
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

    # Disable auth override ONLY for this test
    app.dependency_overrides.clear()

    response = client.post("/api/predictions/predict", json=valid_payload)

    assert response.status_code in (401, 403)
