from typing import Dict, List
from pydantic import BaseModel, Field


class GBSPredictionInput(BaseModel):
    age: float = Field(..., example=34)
    gender: str = Field(..., example="male")
    previous_infection: str = Field(..., example="respiratory")  # must match encoder
    onset_speed: str = Field(..., example="acute")
    muscle_weakness: int = Field(..., ge=0, le=1)
    paralysis: int = Field(..., ge=0, le=1)
    sensory_loss: int = Field(..., ge=0, le=1)
    reflex_loss: int = Field(..., ge=0, le=1)
    respiratory_involvement: int = Field(..., ge=0, le=1)
    cranial_nerve_involvement: int = Field(..., ge=0, le=1)
    motor_velocity: float = Field(..., example=52.1)
    sensory_velocity: float = Field(..., example=36.7)
    amplitude: float = Field(..., example=3.4)
    f_wave_latency: float = Field(..., example=28.2)
    conduction_block: int = Field(..., ge=0, le=1)
    csf_protein: float = Field(..., example=110.5)


class GBSPredictionOutput(BaseModel):
    predicted_subtype: str
    confidence: float
    probabilities: Dict[str, float]
    features_used: List[str]

    model_config = {
        "arbitrary_types_allowed": True
    }
