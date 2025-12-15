from io import BytesIO
from typing import Dict, Any, Optional

import matplotlib
matplotlib.use("Agg")  # ensure backend is compatible with FastAPI

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
)
from reportlab.lib.styles import getSampleStyleSheet


# ============================================================
# MATPLOTLIB CHART HELPERS
# ============================================================

def generate_probability_chart(probabilities: Dict[str, float]) -> Optional[BytesIO]:
    """Generate a bar chart for prediction probabilities."""
    if not probabilities:
        return None

    labels = list(probabilities.keys())
    values = [v * 100 for v in probabilities.values()]  # convert to %

    fig, ax = plt.subplots(figsize=(6, 3))
    ax.bar(labels, values)
    ax.set_ylabel("Probability (%)")
    ax.set_title("Subtype Probability Distribution")
    plt.tight_layout()

    buf = BytesIO()
    FigureCanvas(fig).print_png(buf)
    plt.close(fig)

    buf.seek(0)
    return buf


def generate_shap_chart(shap_data: Dict[str, Any]) -> Optional[BytesIO]:
    """Generate SHAP feature-importance plot."""
    if not shap_data:
        return None

    ranked = shap_data.get("ranked_importance", [])
    if not ranked:
        return None

    top = ranked[:8]  # top 8 features
    features = [f.replace("_", " ") for f, _ in top]
    impacts = [v for _, v in top]

    fig, ax = plt.subplots(figsize=(6, 3))
    ax.barh(features, impacts, color="purple")
    ax.set_title("Top SHAP Feature Contributions")
    ax.set_xlabel("SHAP Impact (Absolute Value)")
    ax.invert_yaxis()

    plt.tight_layout()

    buf = BytesIO()
    FigureCanvas(fig).print_png(buf)
    plt.close(fig)

    buf.seek(0)
    return buf


# ============================================================
# MAIN PDF GENERATOR
# ============================================================

def generate_prediction_pdf(
    prediction: Dict[str, Any],
    shap: Optional[Dict[str, Any]] = None,
) -> bytes:
    """
    Build a complete PDF report containing:
    - Prediction results
    - Probability table + bar chart
    - SHAP table + SHAP bar chart (if SHAP available)
    """

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    story = []

    # --------------------------------------------------------
    # TITLE
    # --------------------------------------------------------
    story.append(Paragraph("<b>GBS Subtype Prediction Report</b>", styles["Title"]))
    story.append(Spacer(1, 20))

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------
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

    # --------------------------------------------------------
    # PROBABILITIES TABLE
    # --------------------------------------------------------
    prob_data = [["Subtype", "Probability (%)"]]
    for subtype, value in prediction["probabilities"].items():
        prob_data.append([subtype, f"{value * 100:.1f}%"])

    table = Table(prob_data)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ]
        )
    )

    story.append(Paragraph("<b>Probability Distribution</b>", styles["Heading3"]))
    story.append(table)
    story.append(Spacer(1, 20))

    # --------------------------------------------------------
    # PROBABILITY BAR CHART
    # --------------------------------------------------------
    prob_chart = generate_probability_chart(prediction["probabilities"])
    if prob_chart:
        story.append(Image(prob_chart, width=400, height=200))
        story.append(Spacer(1, 20))

    # --------------------------------------------------------
    # SHAP SECTION
    # --------------------------------------------------------
    story.append(Paragraph("<b>Model Explainability (SHAP)</b>", styles["Heading3"]))

    if shap:
        # SHAP Table
        shap_rows = [["Feature", "Impact"]]
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

        # SHAP Chart
        shap_chart = generate_shap_chart(shap)
        if shap_chart:
            story.append(Image(shap_chart, width=400, height=200))
        else:
            story.append(
                Paragraph("<i>SHAP chart could not be generated.</i>", styles["Normal"])
            )

        # Clinical interpretation
        story.append(Spacer(1, 16))
        story.append(
            Paragraph(
                "<i>SHAP values quantify how each clinical feature influenced the model’s decision. "
                "Positive values increase the likelihood of the predicted subtype, while negative "
                "values decrease it.</i>",
                styles["BodyText"],
            )
        )

    else:
        story.append(
            Paragraph("<i>SHAP explainability data was not available.</i>", styles["Normal"])
        )

    story.append(Spacer(1, 20))

    # --------------------------------------------------------
    # FOOTER
    # --------------------------------------------------------
    story.append(
        Paragraph(
            "<i>This report was automatically generated by the GBS Subtype Decision Support System.</i>",
            styles["Italic"],
        )
    )

    # --------------------------------------------------------
    # BUILD
    # --------------------------------------------------------
    doc.build(story)

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
