from io import BytesIO
from typing import Dict, Any, Optional

import matplotlib
# Use a non-GUI backend so this works in FastAPI / servers
matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,   # NEW
)
from reportlab.lib.styles import getSampleStyleSheet


# ============================================================
# MATPLOTLIB CHART HELPERS
# ============================================================

def generate_probability_chart(probabilities: Dict[str, float]) -> Optional[BytesIO]:
    """
    Generate a bar chart PNG for probability distribution.
    Returns a BytesIO buffer or None if no probabilities.
    """
    if not probabilities:
        return None

    labels = list(probabilities.keys())
    values = [v * 100 for v in probabilities.values()]

    fig, ax = plt.subplots(figsize=(6, 3))

    ax.bar(labels, values)
    ax.set_ylabel("Probability (%)")
    ax.set_title("Subtype Probability Distribution")

    plt.tight_layout()

    buf = BytesIO()
    canvas = FigureCanvas(fig)
    canvas.print_png(buf)
    plt.close(fig)

    buf.seek(0)
    return buf


def generate_shap_chart(shap_data: Dict[str, Any]) -> Optional[BytesIO]:
    """
    Generate SHAP feature-importance horizontal bar chart.
    Expects shap_data['ranked_importance'] = [(feature, impact), ...].
    Returns BytesIO buffer or None if no SHAP info.
    """
    if not shap_data:
        return None

    ranked = shap_data.get("ranked_importance", [])
    if not ranked:
        return None

    # Show top 8 features
    top = ranked[:8]

    features = [f for f, _ in top]
    impacts = [v for _, v in top]

    fig, ax = plt.subplots(figsize=(6, 3))
    ax.barh(features, impacts, color="purple")
    ax.set_title("Top SHAP Feature Contributions")
    ax.set_xlabel("SHAP impact (absolute value)")
    ax.invert_yaxis()  # highest at top

    plt.tight_layout()

    buf = BytesIO()
    canvas = FigureCanvas(fig)
    canvas.print_png(buf)
    plt.close(fig)

    buf.seek(0)
    return buf


# ============================================================
# MAIN PDF GENERATION SERVICE
# ============================================================

def _pretty_label(key: str) -> str:
    """Convert snake_case to Title Case for table labels."""
    return key.replace("_", " ").title()


def _format_value(key: str, value: Any) -> str:
    """Human-friendly display of clinical input values."""
    if isinstance(value, bool):
        return "Present" if value else "Absent"
    if value is None:
        return "Not recorded"
    # Optional units for some known fields
    if key == "csf_protein":
        return f"{value} mg/dL"
    if key in {"motor_velocity", "sensory_velocity"}:
        return f"{value} m/s"
    if key == "f_wave_latency":
        return f"{value} ms"
    return str(value)


def generate_prediction_pdf(
    prediction: Dict[str, Any],
    shap: Optional[Dict[str, Any]] = None,
    clinical_inputs: Optional[Dict[str, Any]] = None,
) -> bytes:
    """
    Generates a PDF with:
    • Page 1: Prediction summary, probability table + chart, SHAP summary
    • Page 2: Clinical input summary + explanatory notes (if clinical_inputs provided)
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    story = []

    # --------------------------------------------------------
    # PAGE 1 – PREDICTION + SHAP
    # --------------------------------------------------------
    story.append(Paragraph("<b>GBS Subtype Prediction Report</b>", styles["Title"]))
    story.append(Spacer(1, 20))

    # Prediction summary
    story.append(
        Paragraph(
            f"<b>Predicted Subtype:</b> {prediction['predicted_subtype']}",
            styles["Heading2"],
        )
    )
    story.append(
        Paragraph(
            f"<b>Confidence:</b> {(prediction['confidence'] * 100):.1f}%",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 16))

    # Probability table
    prob_data = [["Subtype", "Probability (%)"]]
    for subtype, value in prediction["probabilities"].items():
        prob_data.append([subtype, f"{value * 100:.1f}%"])

    prob_table = Table(prob_data)
    prob_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ]
        )
    )

    story.append(Paragraph("<b>Probability Distribution</b>", styles["Heading3"]))
    story.append(prob_table)
    story.append(Spacer(1, 20))

    # Probability bar chart
    prob_chart = generate_probability_chart(prediction["probabilities"])
    if prob_chart is not None:
        story.append(Image(prob_chart, width=400, height=200))
        story.append(Spacer(1, 20))

    # SHAP section
    story.append(Paragraph("<b>Model Explainability (SHAP)</b>", styles["Heading3"]))

    if shap:
        # Explanation text
        story.append(
            Paragraph(
                "SHAP (SHapley Additive exPlanations) quantifies how each input "
                "feature influenced this individual prediction. Larger absolute "
                "values indicate a stronger contribution toward or against the "
                "predicted subtype.",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 10))

        # SHAP table
        shap_rows = [["Feature", "Impact (|SHAP|)"]]
        for feature, impact in shap.get("ranked_importance", [])[:8]:
            shap_rows.append([feature.replace("_", " "), f"{impact:.4f}"])

        shap_table = Table(shap_rows)
        shap_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ]
            )
        )

        story.append(shap_table)
        story.append(Spacer(1, 20))

        # SHAP bar chart
        shap_chart = generate_shap_chart(shap)
        if shap_chart is not None:
            story.append(Image(shap_chart, width=400, height=200))
        else:
            story.append(
                Paragraph("<i>SHAP visualisation unavailable.</i>", styles["Normal"])
            )
    else:
        story.append(
            Paragraph(
                "<i>SHAP explainability data was not available for this prediction.</i>",
                styles["Normal"],
            )
        )

    story.append(Spacer(1, 20))

    # Short footer on page 1
    story.append(
        Paragraph(
            "This page summarises the model's output and how key features "
            "influenced the predicted subtype.",
            styles["Italic"],
        )
    )

    # --------------------------------------------------------
    # PAGE 2 – CLINICAL INPUT SUMMARY (if available)
    # --------------------------------------------------------
    if clinical_inputs:
        story.append(PageBreak())

        story.append(
            Paragraph("Clinical Input Summary", styles["Heading1"])
        )
        story.append(Spacer(1, 12))

        story.append(
            Paragraph(
                "This page lists the structured clinical information that was "
                "provided to the decision support system at the time of prediction. "
                "Values are shown exactly as entered by the clinician before any "
                "normalisation or scaling by the machine-learning pipeline.",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 16))

        # Build generic feature/value table
        rows = [["Feature", "Value"]]

        # Keep order deterministic
        for key in sorted(clinical_inputs.keys()):
            label = _pretty_label(key)
            value = _format_value(key, clinical_inputs[key])
            rows.append([label, value])

        inputs_table = Table(rows, colWidths=[220, 280])
        inputs_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )

        story.append(inputs_table)
        story.append(Spacer(1, 20))

        # Additional explanatory note
        story.append(
            Paragraph(
                "Binary clinical features (for example muscle weakness, paralysis "
                "or respiratory involvement) are reported as <b>Present</b> or "
                "<b>Absent</b>. Numerical values (such as CSF protein or nerve "
                "conduction parameters) should be interpreted using local clinical "
                "reference ranges and guidelines.",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 10))

        story.append(
            Paragraph(
                "This report is intended to support, not replace, specialist clinical "
                "judgement. Model outputs should always be interpreted in the context "
                "of the full clinical picture.",
                styles["Italic"],
            )
        )

    # --------------------------------------------------------
    # BUILD PDF
    # --------------------------------------------------------
    doc.build(story)

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
