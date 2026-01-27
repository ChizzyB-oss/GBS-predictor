import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Eye, CheckCircle2, Send, MessageSquareText } from "lucide-react";

import DashboardLayout from "../../Components/DashboardLayout";
import { useAuth } from "../../Context/AuthContext";
import { reviewApi } from "../../api/client";

export default function ReviewInbox() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("inbox"); // "inbox" | "sent"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inboxItems, setInboxItems] = useState([]);
  const [sentItems, setSentItems] = useState([]);

  // feedback modal state (recipient -> writes feedback)
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null); // the review row
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  // view feedback modal state (sender -> reads feedback)
  const [viewFeedbackOpen, setViewFeedbackOpen] = useState(false);

  async function loadAll() {
    try {
      setError("");
      setLoading(true);

      const [inbox, outbox] = await Promise.all([
        reviewApi.inbox(token),
        reviewApi.outbox(token),
      ]);

      setInboxItems(Array.isArray(inbox) ? inbox : []);
      setSentItems(Array.isArray(outbox) ? outbox : []);
    } catch (e) {
      console.error(e);
      setInboxItems([]);
      setSentItems([]);
      setError(e.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick counts
  const inboxPendingCount = useMemo(
    () => inboxItems.filter((r) => r.status === "pending").length,
    [inboxItems]
  );

  const sentNewFeedbackCount = useMemo(
    () => sentItems.filter((r) => r.feedback && r.sender_seen === false).length,
    [sentItems]
  );

  async function markAs(reviewId, status) {
    try {
      setError("");
      await reviewApi.updateStatus(reviewId, status, token);
      await loadAll();
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to update status");
    }
  }

  // Recipient opens feedback modal
  function openFeedbackModal(r) {
    setActiveReview(r);
    setFeedbackText(r.feedback || "");
    setFeedbackOpen(true);
    setError("");
  }

  function closeFeedbackModal() {
    setFeedbackOpen(false);
    setActiveReview(null);
    setFeedbackText("");
    setFeedbackSaving(false);
  }

  async function submitFeedback() {
    if (!activeReview) return;

    const text = (feedbackText || "").trim();
    if (!text) {
      setError("Feedback cannot be empty.");
      return;
    }

    try {
      setError("");
      setFeedbackSaving(true);
      await reviewApi.submitFeedback(activeReview.id, text, token);
      closeFeedbackModal();
      await loadAll();
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to submit feedback");
      setFeedbackSaving(false);
    }
  }

  // Sender opens feedback (and mark seen if new)
  async function openViewFeedback(r) {
    setActiveReview(r);
    setViewFeedbackOpen(true);
    setError("");

    // If there is feedback and sender hasn't seen it, mark as seen
    if (r.feedback && r.sender_seen === false) {
      try {
        await reviewApi.markSeen(r.id, token);
        await loadAll();
      } catch (e) {
        console.error(e);
        // not fatal
      }
    }
  }

  function closeViewFeedback() {
    setViewFeedbackOpen(false);
    setActiveReview(null);
  }

  // badge style for status
  function statusBadge(status) {
    if (status === "pending")
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800";
    if (status === "viewed")
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800";
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800";
  }

  const items = tab === "inbox" ? inboxItems : sentItems;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto w-full animate-fadeIn">
        <header className="pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Inbox className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Peer Reviews
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage review requests and exchange feedback inside the system.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setTab("inbox")}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border transition
              ${
                tab === "inbox"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }
            `}
          >
            <Inbox className="w-4 h-4" />
            Inbox
            {inboxPendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full bg-red-600 text-white">
                {inboxPendingCount > 99 ? "99+" : inboxPendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("sent")}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border transition
              ${
                tab === "sent"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }
            `}
          >
            <Send className="w-4 h-4" />
            Sent
            {sentNewFeedbackCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full bg-red-600 text-white">
                {sentNewFeedbackCount > 99 ? "99+" : sentNewFeedbackCount}
              </span>
            )}
          </button>
        </div>

        {loading && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            Loading reviews…
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
              {tab === "inbox" ? "No review requests yet." : "No sent reviews yet."}
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
                    {/* Who */}
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tab === "inbox"
                        ? (r.sender_name || r.sender_email || "Clinician")
                        : (r.recipient_name || r.recipient_email || "Clinician")}
                    </span>

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {tab === "inbox" ? "requested review" : "received your request"}
                    </span>

                    {/* Status */}
                    <span
                      className={`
                        ml-0 sm:ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border
                        ${statusBadge(r.status)}
                      `}
                    >
                      {r.status}
                    </span>

                    {/* New feedback badge (sender side) */}
                    {tab === "sent" && r.feedback && r.sender_seen === false && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800">
                        New feedback
                      </span>
                    )}
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
                    {r.created_at ? new Date(r.created_at).toLocaleString("en-GB") : ""}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-3">
                  {/* View prediction */}
                  <button
                    onClick={async () => {
                      if (tab === "inbox" && r.status === "pending") {
                        await markAs(r.id, "viewed");
                      }
                      navigate(`/prediction-result/${r.prediction_id}`, {
                        state: { shared: true },
                      });
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

                  {/* Recipient: submit feedback */}
                  {tab === "inbox" && (
                    <button
                      onClick={() => openFeedbackModal(r)}
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
                    >
                      <MessageSquareText className="w-4 h-4" />
                      {r.feedback ? "Edit Feedback" : "Add Feedback"}
                    </button>
                  )}

                  {/* Sender: view feedback */}
                  {tab === "sent" && r.feedback && (
                    <button
                      onClick={() => openViewFeedback(r)}
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
                    >
                      <MessageSquareText className="w-4 h-4" />
                      View Feedback
                    </button>
                  )}

                  {/* Optional: mark resolved (recipient only) */}
                  {tab === "inbox" && (
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
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Modal (recipient writes) */}
        {feedbackOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40" onClick={closeFeedbackModal} />
            <div
              className="
                relative w-full max-w-lg rounded-xl
                bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-800
                shadow-2xl p-6
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Provide Feedback
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Your feedback will be recorded and the sender will be notified.
                  </p>
                </div>
                <button
                  onClick={closeFeedbackModal}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Prediction:</span>{" "}
                  {activeReview?.predicted_subtype ?? "—"}{" "}
                  <span className="text-slate-500 dark:text-slate-400">
                    (ID: {activeReview?.prediction_id})
                  </span>
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  className="
                    w-full rounded-md
                    border border-slate-300 dark:border-slate-700
                    bg-white dark:bg-slate-900
                    px-3 py-2
                    text-slate-900 dark:text-slate-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  "
                  placeholder="Write your clinical feedback (e.g., differential diagnoses, additional tests, treatment considerations)…"
                />
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: Keep feedback brief and action-oriented for showcase.
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closeFeedbackModal}
                  className="
                    flex-1 py-2.5 rounded-md
                    border border-slate-300 dark:border-slate-700
                    bg-white dark:bg-slate-800
                    text-slate-800 dark:text-white
                    hover:bg-slate-100 dark:hover:bg-slate-700
                    transition
                  "
                  disabled={feedbackSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  className="
                    flex-1 py-2.5 rounded-md
                    bg-blue-600 hover:bg-blue-700
                    text-white font-semibold
                    transition
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                  disabled={feedbackSaving}
                >
                  {feedbackSaving ? "Submitting…" : "Submit Feedback"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Feedback Modal (sender reads) */}
        {viewFeedbackOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40" onClick={closeViewFeedback} />
            <div
              className="
                relative w-full max-w-lg rounded-xl
                bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-800
                shadow-2xl p-6
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Reviewer Feedback
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Feedback received for your shared prediction.
                  </p>
                </div>
                <button
                  onClick={closeViewFeedback}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Prediction:</span>{" "}
                  {activeReview?.predicted_subtype ?? "—"}{" "}
                  <span className="text-slate-500 dark:text-slate-400">
                    (ID: {activeReview?.prediction_id})
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activeReview?.feedback_at
                    ? `Feedback at: ${new Date(activeReview.feedback_at).toLocaleString("en-GB")}`
                    : ""}
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {activeReview?.feedback || "No feedback provided."}
                </p>
              </div>

              <div className="mt-6">
                <button
                  onClick={closeViewFeedback}
                  className="
                    w-full py-2.5 rounded-md
                    bg-blue-600 hover:bg-blue-700
                    text-white font-semibold transition
                  "
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}