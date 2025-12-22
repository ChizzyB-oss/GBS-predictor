import { useEffect, useState } from "react";
import { History, FileClock, BarChart3, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../Components/DashboardLayout";
import { useAuth } from "../../Context/AuthContext";
import { predictionApi } from "../../api/client";

export default function PredictionHistory() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------
  // Subtype badge colours (clinical)
  // ------------------------------
  const subtypeColor = (s) => {
    switch (s) {
      case "AIDP":
        return "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "AMAN":
        return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "AMSAN":
        return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "MFS":
        return "bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  // ------------------------------
  // Download PDF
  // ------------------------------
  const handleDownloadPDF = async (id) => {
    try {
      const res = await predictionApi.downloadReport(id, token);
      if (!res.ok) throw new Error("Failed to download report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `GBS_Report_${id}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Could not download report. Try again.");
    }
  };

  // ------------------------------
  // Fetch history
  // ------------------------------
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(
          "http://127.0.0.1:8000/api/prediction/history",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to load predictions");

        const data = await res.json();
        const cleaned = data.map((p) => ({
          ...p,
          input_data:
            typeof p.input_data === "string"
              ? JSON.parse(p.input_data)
              : p.input_data,
        }));

        setPredictions(cleaned);
      } catch (err) {
        console.error(err);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [token]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto w-full animate-fadeIn">

        {/* HEADER */}
        <header className="pb-4 mb-10 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Prediction History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review previous GBS subtype predictions and download reports.
          </p>
        </header>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            Loading prediction history…
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && predictions.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
            <History className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              No Predictions Yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              When predictions are made, they will appear here.
            </p>
          </div>
        )}

        {/* PREDICTION LIST */}
        <div className="space-y-6">
          {predictions.map((p) => (
            <div
              key={p.id}
              className="
                bg-white dark:bg-slate-900 
                border border-slate-200 dark:border-slate-800 
                rounded-xl shadow-sm p-6 
                hover:shadow-md transition
              "
            >
              {/* TOP ROW */}
              <div className="flex items-start justify-between mb-4">

                {/* BADGE + CONFIDENCE */}
                <div className="flex flex-col gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${subtypeColor(
                      p.predicted_subtype
                    )}`}
                  >
                    {p.predicted_subtype}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Confidence: {(p.confidence * 100).toFixed(1)}%
                    </span>

                    <div className="w-32 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                        style={{ width: `${p.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-3">
                  {/* VIEW DETAILS */}
                  <button
                    onClick={() => navigate(`/prediction-result/${p.id}`)}
                    className="
                      px-4 py-2 rounded-md
                      border border-slate-300 dark:border-slate-700
                      text-slate-700 dark:text-slate-300
                      bg-white dark:bg-slate-800
                      hover:bg-slate-50 dark:hover:bg-slate-700
                      text-sm font-medium
                      transition
                    "
                  >
                    View Details
                  </button>

                  {/* PDF */}
                  <button
                    onClick={() => handleDownloadPDF(p.id)}
                    className="
                      flex items-center gap-2 px-4 py-2
                      rounded-md bg-blue-600 hover:bg-blue-700 
                      dark:bg-blue-500 dark:hover:bg-blue-600
                      text-white text-sm font-semibold
                      shadow-sm transition
                    "
                  >
                    <FileDown className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>

              {/* PATIENT INFO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-5">
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Age:</span> {p.input_data.age}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Gender:</span>{" "}
                  {p.input_data.gender}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-medium">CSF Protein:</span>{" "}
                  {p.input_data.csf_protein} mg/dL
                </p>
              </div>

              {/* SYMPTOMS */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries({
                  muscle_weakness: "Muscle Weakness",
                  paralysis: "Paralysis",
                  sensory_loss: "Sensory Loss",
                  reflex_loss: "Reflex Loss",
                  respiratory_involvement: "Respiratory Involvement",
                  cranial_nerve_involvement: "Cranial Nerve Involvement",
                  conduction_block: "Conduction Block",
                })
                  .filter(([key]) => p.input_data[key])
                  .map(([key, label]) => (
                    <span
                      key={key}
                      className="
                        px-3 py-1 rounded-full text-xs font-medium 
                        bg-slate-100 dark:bg-slate-800 
                        text-slate-700 dark:text-slate-300 
                        border border-slate-200 dark:border-slate-700
                      "
                    >
                      {label}
                    </span>
                  ))}
              </div>

              {/* TIMESTAMP */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                <FileClock className="w-4 h-4" />
                {p.created_at &&
                  new Date(p.created_at).toLocaleString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
