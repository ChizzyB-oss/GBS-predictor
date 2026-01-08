from pydantic import BaseModel
from typing import List


class ChatFeature(BaseModel):
    feature: str
    importance: float


class ChatRequest(BaseModel):
    question: str
    predicted_subtype: str
    confidence: float
    top_features: List[ChatFeature]


class ChatResponse(BaseModel):
    answer: str
