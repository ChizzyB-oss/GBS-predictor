import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Eye, CheckCircle2 } from "lucide-react";

import DashboardLayout from "../../Components/DashboardLayout";
import { useAuth } from "../../Context/AuthContext";
import { reviewApi } from "../../api/client";

export default function ReviewInbox() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function loadInbox() {
  try {
    setError("");
    setLoading(true);

    const data = await reviewApi.inbox(token);

    // Accept both: [] OR { items: [] } OR { inbox: [] }
    const list =
      Array.isArray(data) ? data :
      Array.isArray(data?.items) ? data.items :
      Array.isArray(data?.inbox) ? data.inbox :
      [];

    setItems(list);
  } catch (e) {
    console.error(e);
    setItems([]);
    setError(e.message || "Failed to load inbox");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markAs(reviewId, status) {
    try {
      const res = await reviewApi.updateStatus(reviewId, status, token);
      if (!res.ok) throw new Error("Failed to update status");
      // refresh list
      await loadInbox();
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not update status");
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto w-full animate-fadeIn">
        <header className="pb-4 mb-8 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Inbox className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Review Inbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Peer review requests sent to you by other clinicians.
          </p>
        </header>

        {loading && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            Loading review requests…
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center shadow-sm">
            <p className="text-slate-600 dark:text-slate-400">
              No review requests yet.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {items.map((r) => (
            <div
              key={r.id}
              className="
                bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-800
                rounded-xl shadow-sm p-6
              "
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {r.sender_name || r.sender_email || "Clinician"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      requested review
                    </span>

                    <span
                      className={`
                        ml-0 sm:ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold
                        border
                        ${
                          r.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800"
                            : r.status === "viewed"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800"
                        }
                      `}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Prediction:</span>{" "}
                    {r.predicted_subtype ?? "—"}{" "}
                    <span className="text-slate-500 dark:text-slate-400">
                      (ID: {r.prediction_id})
                    </span>
                  </div>

                  {r.confidence != null && (
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Confidence:</span>{" "}
                      {(r.confidence * 100).toFixed(1)}%
                    </div>
                  )}

                  {r.note && (
                    <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Note:</span> {r.note}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString("en-GB")
                      : ""}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-3">
                  <button
                    onClick={async () => {
                      // Mark viewed, then open prediction details
                      if (r.status === "pending") await markAs(r.id, "viewed");
                      navigate(`/prediction-result/${r.prediction_id}`);
                    }}
                    className="
                      inline-flex items-center justify-center gap-2
                      px-4 py-2 rounded-md
                      bg-blue-600 hover:bg-blue-700
                      text-white text-sm font-semibold
                      transition
                    "
                  >
                    <Eye className="w-4 h-4" />
                    View Prediction
                  </button>

                  <button
                    onClick={() => markAs(r.id, "resolved")}
                    className="
                      inline-flex items-center justify-center gap-2
                      px-4 py-2 rounded-md
                      border border-slate-300 dark:border-slate-700
                      bg-white dark:bg-slate-800
                      text-slate-800 dark:text-white
                      hover:bg-slate-100 dark:hover:bg-slate-700
                      text-sm font-semibold
                      transition
                    "
                    disabled={r.status === "resolved"}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
