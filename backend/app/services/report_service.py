from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import json


def generate_prediction_pdf(prediction_obj, shap_data=None):
    """
    Generates a PDF clinical-style report for a prediction.
    Returns an in-memory BytesIO file.
    """

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)

    # -------------------------------------------------------------
    # PDF HEADER
    # -------------------------------------------------------------
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, 800, "GBS Subtype Prediction Report")

    c.setFont("Helvetica", 10)
    c.drawString(50, 785, f"Prediction ID: {prediction_obj.id}")
    c.drawString(50, 770, f"Date: {prediction_obj.created_at}")

    c.line(50, 760, 550, 760)

    # -------------------------------------------------------------
    # SECTION 1 — USER INPUT SUMMARY
    # -------------------------------------------------------------
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 740, "1. Patient Input Data")

    c.setFont("Helvetica", 10)
    y = 720

    try:
        input_data = json.loads(prediction_obj.input_data)
    except:
        input_data = {}

    for key, val in input_data.items():
        c.drawString(60, y, f"{key}: {val}")
        y -= 14
        if y < 60:
            c.showPage()
            y = 800

    # -------------------------------------------------------------
    # SECTION 2 — PREDICTION OUTPUT
    # -------------------------------------------------------------
    c.setFont("Helvetica-Bold", 14)
    y -= 20
    c.drawString(50, y, "2. Model Output")

    c.setFont("Helvetica", 10)
    y -= 20
    c.drawString(60, y, f"Predicted Subtype: {prediction_obj.predicted_subtype}")
    y -= 14
    c.drawString(60, y, f"Confidence: {round(prediction_obj.confidence * 100, 2)}%")

    # Probabilities
    y -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, y, "Subtype Probabilities:")

    c.setFont("Helvetica", 10)
    y -= 18

    try:
        probs = json.loads(prediction_obj.probabilities)
    except:
        probs = {}

    for subtype, prob in probs.items():
        c.drawString(70, y, f"{subtype}: {round(prob * 100, 2)}%")
        y -= 14

    # -------------------------------------------------------------
    # SECTION 3 — SHAP EXPLAINABILITY
    # -------------------------------------------------------------
    if shap_data:
        y -= 20
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "3. Model Explainability (SHAP)")

        y -= 20
        c.setFont("Helvetica-Bold", 12)
        c.drawString(60, y, "Most important features:")

        y -= 18
        c.setFont("Helvetica", 10)

        ranked = shap_data.get("ranked_importance", [])
        for feature, value in ranked[:10]:  # top 10 features
            c.drawString(70, y, f"{feature}: {round(value, 4)}")
            y -= 14
            if y < 60:
                c.showPage()
                y = 800

    else:
        y -= 20
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "3. SHAP Explainability")
        y -= 20
        c.setFont("Helvetica", 10)
        c.drawString(60, y, "SHAP data unavailable for this prediction.")

    # -------------------------------------------------------------
    # FOOTER
    # -------------------------------------------------------------
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(50, 40, "Generated automatically by the GBS Clinical Decision Support System.")
    c.drawString(50, 28, "This report is for research and prototyping only — not for clinical use.")

    c.save()
    buffer.seek(0)
    return buffer
