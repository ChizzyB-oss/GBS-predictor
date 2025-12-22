import { X, CheckCircle, FileText } from "lucide-react";
import { API_BASE_URL } from "../api/client";
import { useAuth } from "../Context/AuthContext";

export default function PredictionResultModal({ open, onClose, result }) {
  if (!open || !result) return null;

  const { token } = useAuth();

  const probabilities = result.probabilities || {};
  const features = result.features_used || [];

  const shap = result.shap || null;
  const shapValues = shap?.shap_values || {};
  const ranked = shap?.ranked_importance || [];
  const hasShap = shap !== null && Object.keys(shapValues).length > 0;

  // RESTORED ORIGINAL PROBABILITY BAR COLOURS
  const subtypeColors = {
    AIDP: "#2563EB",
    AMAN: "#059669",
    AMSAN: "#D97706",
    MFS: "#D946EF",
    default: "#7C3AED",
  };

  async function downloadReport(id, token) {
    const response = await fetch(`${API_BASE_URL}/api/predictions/${id}/report`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center 
                 justify-center px-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-2xl rounded-xl 
          bg-white dark:bg-slate-900 
          border border-slate-200 dark:border-slate-800 
          shadow-xl p-8 relative 
          animate-[slideUp_0.25s_ease-out] 
          max-h-[85vh] overflow-y-auto no-scrollbar
        "
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-red-500 transition"
        >
          <X className="w-6 h-6" />
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Subtype:</p>

          <span className="
            px-5 py-1.5 rounded-md 
            text-lg font-semibold 
            bg-blue-100 text-blue-700 
            dark:bg-blue-900 dark:text-blue-300
          ">
            {result.predicted_subtype}
          </span>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Confidence
          </p>

          <p className="text-4xl font-bold text-slate-900 dark:text-white">
            {(result.confidence * 100).toFixed(1)}%
          </p>
        </div>

        {/* ================= Probability Distribution ================ */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Probability Distribution
          </h3>

          <div className="space-y-4">
            {Object.entries(probabilities).map(([subtype, prob]) => {
              const percent = (prob * 100).toFixed(1);
              const color = subtypeColors[subtype] || subtypeColors.default;

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
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== SHAP Explainability ===================== */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Model Explainability
          </h3>

          {!hasShap && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              SHAP explainability data not available.
            </p>
          )}

          {hasShap && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Features contributing most to the prediction:
              </p>

              <div className="space-y-5">
                {ranked.slice(0, 6).map(([feature, value]) => {
                  const impact = shapValues[feature];
                  const positive = impact >= 0;

                  return (
                    <div key={feature} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {feature.replace(/_/g, " ")}
                        </span>

                        <span
                          className={`font-semibold ${
                            positive
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {positive
                            ? "↑ increases likelihood"
                            : "↓ decreases likelihood"}
                        </span>
                      </div>

                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden">
                        <div
                          className={`
                            h-3 rounded-md transition-all
                            ${positive ? "bg-green-500" : "bg-red-500"}
                          `}
                          style={{
                            width: `${Math.min(Math.abs(impact) * 250, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ======================= Features Used ======================= */}
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

        {/* ======================= Action Buttons ======================= */}
        <div className="mt-10 flex gap-4">
          <button
            onClick={onClose}
            className="
              flex-1 py-3 rounded-md border border-slate-300 
              bg-white text-slate-800 
              dark:border-slate-700 dark:bg-slate-800 dark:text-white 
              hover:bg-slate-100 dark:hover:bg-slate-700
              transition
            "
          >
            Close
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
  );
}
