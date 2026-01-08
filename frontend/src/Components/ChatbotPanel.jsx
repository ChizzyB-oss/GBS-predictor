import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";

export default function ChatbotPanel({ prediction }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "Why was this subtype predicted?",
    "Which clinical features influenced this prediction the most?",
    "How should the confidence score be interpreted?",
  ];

  // 🔄 Reset / refresh chatbot
  function resetChatbot() {
    setMessages([]);
    setQuestion("");
    setLoading(false);
  }

  async function askChatbot(customQuestion) {
    const finalQuestion = customQuestion ?? question;
    if (!finalQuestion.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: finalQuestion }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("gbs_token");

      // Ensure SHAP summary matches backend schema
      const topFeatures = Array.isArray(prediction.top_features)
        ? prediction.top_features.map((f) => ({
            feature: String(f.feature),
            importance: Number(f.importance),
          }))
        : [];

      // Ensure features_used is always an array of strings
      const featuresUsed = Array.isArray(prediction.features_used)
        ? prediction.features_used.map((f) => String(f))
        : [];

      const res = await fetch("http://127.0.0.1:8000/chat/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: finalQuestion,
          predicted_subtype: String(prediction.predicted_subtype),
          confidence: Number(prediction.confidence),
          top_features: topFeatures,
          features_used: featuresUsed, // ✅ NEW
        }),
      });

      if (!res.ok) {
        throw new Error(`Chatbot request failed (${res.status})`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.answer },
      ]);
    } catch (err) {
      console.error("❌ Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            "The assistant could not generate an explanation at this time. "
            + "Please try again.",
        },
      ]);
    } finally {
      setQuestion("");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
      >
        <MessageSquare />
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-96 bg-white border rounded-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
            <h3 className="font-semibold text-sm">
              Clinical Decision Support Assistant
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={resetChatbot}
                className="text-xs text-blue-600 hover:underline"
                title="Reset conversation"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  resetChatbot();
                  setOpen(false);
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.length === 0 && (
              <>
                <p className="text-gray-500 mb-2">
                  Ask about the prediction, contributing features, or confidence.
                </p>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Suggested questions:</p>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => askChatbot(q)}
                      className="block w-full text-left text-xs text-blue-600 hover:underline"
                    >
                      • {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded ${
                  m.role === "bot"
                    ? "bg-blue-50 text-blue-800"
                    : "bg-gray-100"
                }`}
              >
                <strong>{m.role === "bot" ? "Assistant" : "You"}:</strong>{" "}
                {m.text}
              </div>
            ))}

            {loading && (
              <p className="text-gray-400 text-xs">Generating explanation…</p>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-2 flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="Why was this subtype predicted?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askChatbot()}
            />
            <button
              onClick={() => askChatbot()}
              className="bg-blue-600 text-white px-3 rounded"
            >
              <Send size={14} />
            </button>
          </div>

          {/* Disclaimer */}
          <div className="text-[10px] text-gray-500 px-3 py-1 border-t">
            This assistant provides explanatory support only and does not replace
            clinical judgement.
          </div>
        </div>
      )}
    </>
  );
}
