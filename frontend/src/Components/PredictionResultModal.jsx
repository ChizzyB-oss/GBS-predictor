import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle, FileText, ArrowLeft } from "lucide-react";

import DashboardLayout from "../Components/DashboardLayout";
import ChatbotPanel from "../Components/ChatbotPanel";
import { API_BASE_URL, predictionApi } from "../api/client";
import { useAuth } from "../Context/AuthContext";

export default function PredictionResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  // Result can come from navigation OR be fetched by ID
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(false);

  // ------------------------------
  // Fetch prediction if opened from history
  // ------------------------------
  useEffect(() => {
  if (!result && id) {
    setLoading(true);

    predictionApi
      .getPredictionById(id, token)
      .then((data) => setResult(data))
      .catch((err) => {
        console.error(err);
        setResult(null);
      })
      .finally(() => setLoading(false));
  }
}, [id, result, token]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          Loading prediction…
        </div>
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Prediction not found.
          </p>
          <button
            onClick={() => navigate("/clinician/history")}
            className="
              px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700
              text-white font-semibold transition
            "
          >
            Back to History
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const probabilities = result.probabilities || {};
  const features = result.features_used || [];

  const shap = result.shap || null;
  const shapValues = shap?.shap_values || {};
  const ranked = shap?.ranked_importance || [];
  const hasShap = shap && Array.isArray(ranked) && ranked.length > 0;
  const topRanked = ranked.slice(0, 8); // match PDF top 8
  const maxAbsImpact =
  topRanked.length > 0
    ? Math.max(...topRanked.map(([, v]) => Math.abs(Number(v) || 0)))
    : 1;

  // Probability colours (UNCHANGED)
  const subtypeColors = {
    AIDP: "#2563EB",
    AMAN: "#059669",
    AMSAN: "#D97706",
    MFS: "#D946EF",
    default: "#7C3AED",
  };

  // Clinical guidance
  const subtypeNotes = {
    AIDP:
      "This presentation is consistent with demyelinating GBS. Consider early neurological referral, respiratory monitoring, and initiation of IVIg or plasma exchange where clinically indicated.",
    AMAN:
      "This subtype is primarily motor and axonal. Monitor for rapid progression and respiratory compromise. Early immunotherapy and supportive care are recommended.",
    AMSAN:
      "This severe axonal subtype affects both motor and sensory nerves. Prognosis may be prolonged. Early ICU involvement and rehabilitation planning are advised.",
    MFS:
      "Miller Fisher Syndrome often presents with ophthalmoplegia and ataxia. Prognosis is generally favourable, but neurological follow-up remains important.",
    default:
      "Interpret this prediction alongside clinical judgement and further diagnostic investigations.",
  };

  async function downloadReport(id) {
    const response = await fetch(
      `${API_BASE_URL}/api/predictions/${id}/report`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      alert("Failed to download report");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `prediction_${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto py-10 px-4">
        <div
          className="
            w-full rounded-xl
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            shadow-lg
            p-6 sm:p-8
          "
        >
          {/* Back Button */}
          <button
            onClick={() => navigate("/clinician/history")}
            className="
              mb-4 flex items-center gap-2
              text-slate-600 dark:text-slate-400
              hover:text-blue-600 dark:hover:text-blue-400
              transition
            "
          >
            <ArrowLeft className="w-5 h-5" />
            History
          </button>

          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-center text-slate-900 dark:text-slate-100">
            Prediction Completed
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mt-1">
            AI-assisted subtype prediction is ready.
          </p>

          {/* Subtype + Confidence */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Subtype:
            </p>

            <span
              className="
                px-5 py-1.5 rounded-md
                text-lg font-semibold
                bg-blue-100 text-blue-700
                dark:bg-blue-900 dark:text-blue-300
              "
            >
              {result.predicted_subtype}
            </span>

{/* Confidence Interval */}
<p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
  Confidence Interval
</p>

{result.confidence_interval?.lower != null &&
 result.confidence_interval?.upper != null ? (
  <>
    <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
      {(result.confidence_interval.lower * 100).toFixed(1)}% –{" "}
      {(result.confidence_interval.upper * 100).toFixed(1)}%
    </p>

    {/* Optional: keep point estimate small for transparency */}
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
      Point estimate: {(result.confidence * 100).toFixed(1)}%
    </p>
  </>
) : (
  // Fallback for older predictions that don't have CI yet
  <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
    {(result.confidence * 100).toFixed(1)}%
  </p>
)}
          </div>

          {/* ================= Clinical Guidance ================= */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Clinical Guidance (For Decision Support Only)
            </h3>

            <div
              className="
                border border-slate-200 dark:border-slate-700
                bg-slate-50 dark:bg-slate-800
                rounded-md p-4
              "
            >
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {subtypeNotes[result.predicted_subtype] ||
                  subtypeNotes.default}
              </p>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                ⚠️ This guidance is informational and must not replace
                professional clinical judgement.
              </p>
            </div>
          </div>

          {/* ================= Probability Distribution ================= */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Probability Distribution
            </h3>

            <div className="space-y-4">
              {Object.entries(probabilities).map(([subtype, prob]) => {
                const percent = (prob * 100).toFixed(1);
                const color =
                  subtypeColors[subtype] || subtypeColors.default;

                return (
                  <div key={subtype}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {subtype}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden">
                      <div
                        className="h-3 rounded-md transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

{/* ================= SHAP Explainability ================= */}
<div className="mt-10">
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
    Model Explainability (SHAP)
  </h3>

  {!hasShap && (
    <p className="text-slate-500 dark:text-slate-400 text-sm">
      SHAP explainability data not available.
    </p>
  )}

  {hasShap && (
    <>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Top feature contributions for this prediction (higher values indicate stronger influence).
      </p>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-12 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">
        <div className="col-span-5">Feature</div>
        <div className="col-span-5">Contribution (|SHAP|)</div>
        <div className="col-span-2 text-right">Value</div>
      </div>

      <div className="space-y-3">
        {topRanked.map(([feature, impactRaw]) => {
          const impact = Math.abs(Number(impactRaw) || 0);
          const widthPct = Math.min(100, (impact / (maxAbsImpact || 1)) * 100);

          return (
            <div
              key={feature}
              className="
                rounded-lg border border-slate-200 dark:border-slate-800
                bg-white dark:bg-slate-900
                p-3
              "
            >
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Feature name */}
                <div className="col-span-12 sm:col-span-5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {String(feature).replace(/_/g, " ")}
                  </p>
                </div>

                {/* Bar */}
                <div className="col-span-10 sm:col-span-5">
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden">
                    <div
                      className="h-3 rounded-md bg-purple-600 dark:bg-purple-500 transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>

                {/* Numeric */}
                <div className="col-span-2 text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {impact.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional note mirrors PDF wording */}
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Note: SHAP values quantify the contribution of each feature to this individual prediction.
      </p>
    </>
  )}
</div>

          {/* ================= Features Used ================= */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Features Used
            </h3>

            <div className="flex flex-wrap gap-2">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="
                    px-3 py-1 rounded-md text-xs font-medium
                    bg-purple-100 text-purple-700
                    dark:bg-purple-900 dark:text-purple-300
                  "
                >
                  {feature.replace(/_/g, " ")}
                </span>
              ))}

              {features.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No features provided.
                </p>
              )}
            </div>
          </div>

          {/* ================= Action Buttons ================= */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/clinician/predict")}
              className="
                flex-1 py-3 rounded-md border border-slate-300
                bg-white text-slate-800
                dark:border-slate-700 dark:bg-slate-800 dark:text-white
                hover:bg-slate-100 dark:hover:bg-slate-700
                transition
              "
            >
              Make Another Prediction
            </button>

            <button
              onClick={() => downloadReport(result.id, token)}
              className="
                flex-1 py-3 rounded-md bg-blue-600 hover:bg-blue-700
                text-white font-semibold
                flex items-center justify-center gap-2 transition
              "
            >
              <FileText className="w-5 h-5" />
              Download Full PDF Report
            </button>
          </div>
        </div>
      </div>
      <ChatbotPanel prediction={result} />
    </DashboardLayout>
  );
}
