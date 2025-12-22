import { useEffect, useState } from "react";
import DashboardLayout from "../../Components/DashboardLayout";
import { FileClock, BarChart3 } from "lucide-react";
import { adminApi } from "../../api/client";

export default function AdminPredictions() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    try {
      const token = localStorage.getItem("gbs_token");
      const data = await adminApi.getRecentPredictions(token);
      setPredictions(data);
    } catch (err) {
      console.error("Failed to load admin predictions:", err);
    }
    setLoading(false);
  }

  // ---------- Subtype Color Scheme ----------
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          Loading predictions…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto animate-fadeIn space-y-10">

        {/* PAGE HEADER */}
        <header className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            All Predictions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System-wide GBS subtype predictions across all clinicians.
          </p>
        </header>

        {/* EMPTY STATE */}
        {predictions.length === 0 && (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            No predictions found.
          </div>
        )}

        {/* PREDICTION LIST */}
        <div className="space-y-5">
          {predictions.map((p) => (
            <div
              key={p.id}
              className="
                bg-white dark:bg-slate-900 
                border border-slate-200 dark:border-slate-800 
                p-6 rounded-xl shadow-sm 
                hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/60 
                transition
              "
            >
              {/* TOP SECTION */}
              <div className="flex items-start justify-between mb-4">

                {/* Subtype + Confidence */}
                <div className="flex flex-col gap-2">
                  <span
                    className={`
                      text-xs px-3 py-1 rounded-full font-semibold border
                      ${subtypeColor(p.predicted_subtype)}
                    `}
                  >
                    {p.predicted_subtype}
                  </span>

                  {/* Confidence Bar */}
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

                {/* Clinician ID */}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Clinician ID:  
                  <span className="font-medium ml-1 text-slate-700 dark:text-slate-300">
                    {p.user_id}
                  </span>
                </div>
              </div>

              {/* TIMESTAMP */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <FileClock className="w-4 h-4" />
                {new Date(p.created_at).toLocaleString("en-GB", {
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
