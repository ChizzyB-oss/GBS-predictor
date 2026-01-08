from fastapi import APIRouter, Depends
from typing import Any

from ..schemas.chatbot import ChatRequest, ChatResponse
from ..services.chatbot_service import generate_chatbot_response
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/explain", response_model=ChatResponse)
def explain_prediction(
    payload: ChatRequest,
    current_user: Any = Depends(get_current_user),
):
    # Optional debug log
    print("📥 Chatbot request received")

    answer = generate_chatbot_response(payload)
    return ChatResponse(answer=answer)
