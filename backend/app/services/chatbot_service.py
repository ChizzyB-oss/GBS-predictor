from typing import List, Dict
from ..schemas.chatbot import ChatRequest

FORBIDDEN_TERMS = [
    "diagnose", "diagnosis", "treatment", "medication",
    "prescribe", "dose", "cure", "therapy"
]


def enforce_guardrails(text: str) -> str:
    for term in FORBIDDEN_TERMS:
        if term in text.lower():
            return (
                "This system cannot provide diagnostic or treatment advice. "
                "It is intended solely to support clinical interpretation."
            )
    return text


def detect_intent(question: str) -> str:
    q = question.lower().strip()
    print(f"🧠 Chatbot received question: '{q}'")

    if "confidence" in q:
        print("➡️ Intent detected: CONFIDENCE")
        return "CONFIDENCE"

    if "feature" in q or "influence" in q:
        print("➡️ Intent detected: FEATURES")
        return "FEATURES"

    if "why" in q or "reason" in q:
        print("➡️ Intent detected: WHY")
        return "WHY"

    if "limit" in q or "uncertain" in q:
        print("➡️ Intent detected: LIMITATIONS")
        return "LIMITATIONS"

    print("➡️ Intent detected: GENERAL")
    return "GENERAL"


def generate_chatbot_response(payload: ChatRequest) -> str:
    intent = detect_intent(payload.question)

    subtype = payload.predicted_subtype
    confidence_pct = round(payload.confidence * 100, 2)
    features = payload.top_features or []

    feature_text = ", ".join(
        [f"{f.feature} (impact {f.importance})" for f in features]
    ) or "no dominant features identified"

    # ⛔ RETURN IMMEDIATELY PER INTENT

    if intent == "CONFIDENCE":
        response = (
            f"The confidence score of **{confidence_pct}%** reflects how strongly "
            f"the model’s learned patterns matched the provided clinical inputs "
            f"for the predicted subtype **{subtype}**. "
            f"It is not a probability of correctness and should be interpreted "
            f"alongside clinical judgement."
        )
        return enforce_guardrails(response)

    if intent == "FEATURES":
        response = (
            f"The prediction was primarily influenced by the following features: "
            f"{feature_text}. These values indicate relative contribution to the "
            f"model’s internal decision-making process."
        )
        return enforce_guardrails(response)

    if intent == "WHY":
        response = (
            f"The subtype **{subtype}** was predicted because the combination of "
            f"input features most closely aligned with learned patterns for this "
            f"subtype. The strongest contributors were: {feature_text}."
        )
        return enforce_guardrails(response)

    if intent == "LIMITATIONS":
        response = (
            "This prediction is based on patterns learned from historical data "
            "and may be affected by dataset bias, feature representation, and "
            "missing clinical context. It should not be used as a standalone "
            "diagnostic decision."
        )
        return enforce_guardrails(response)

    # Fallback (only if nothing matched)
    response = (
        f"The system predicted subtype **{subtype}** with a confidence of "
        f"{confidence_pct}%. You may ask about feature influence, confidence "
        f"interpretation, or model limitations."
    )
    return enforce_guardrails(response)

