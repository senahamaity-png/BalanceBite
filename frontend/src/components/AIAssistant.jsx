
import { useState } from "react";
import api from "../services/api";
import "./AIAssistant.css";

const createWelcomeMessage = () => ({
  role: "assistant",
  content:
    "Hi! I'm your BalanceBite Nutrition Agent! ✨ I can search foods, analyse your daily nutrition, compare your progress with your goals, and help update your food diary with your permission.",
  time: new Date(),
});

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([createWelcomeMessage()]);
  const [pendingAction, setPendingAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addMessage(role, content) {
    setMessages((previous) => [
      ...previous,
      {
        role,
        content,
        time: new Date(),
      },
    ]);
  }

  // Send message to AI Agent
  async function sendMessage(event) {
    event.preventDefault();

    const text = message.trim();

    if (!text || loading) return;

    // Do not lose an existing pending confirmation
    if (pendingAction) {
      setError(
        "Please Confirm Add or Cancel the pending diary update first."
      );
      return;
    }

    addMessage("user", text);
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        message: text,
      });

      const data = response.data;

      addMessage(
        "assistant",
        data.reply ||
          "I couldn't generate a response. Please try again."
      );

      setPendingAction(data.pendingAction || null);
    } catch (err) {
      console.error("AI Chat Error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to contact the Nutrition Agent. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Confirm and save diary action
  async function confirmAction() {
    if (!pendingAction || loading) return;

    const confirmationToken = pendingAction.confirmationToken;

    if (!confirmationToken) {
      setError(
        "Confirmation token is missing. Please ask the agent again."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/ai/confirm-add", {
        confirmationToken,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Diary update failed."
        );
      }

      addMessage(
        "assistant",
        `✅ ${response.data.message || "Food added to your diary successfully!"}`
      );

      setPendingAction(null);
    } catch (err) {
      console.error("AI Confirmation Error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Could not confirm the diary update. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Cancel proposed action without database write
  function cancelAction() {
    if (loading || !pendingAction) return;

    setPendingAction(null);
    setError("");

    addMessage(
      "assistant",
      "No problem! I cancelled the proposed diary update. Nothing was added to your food diary. 😊"
    );
  }

  // Clear conversation
  function clearChat() {
    if (loading) return;

    setMessages([createWelcomeMessage()]);
    setPendingAction(null);
    setError("");
    setMessage("");
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="ai-assistant">
      {/* Header */}
      <div className="ai-assistant-header">
        <div>
          <span className="ai-status">
            <span className="ai-status-dot"></span>
            AI Nutrition Assistant
          </span>

          <h3>BalanceBite Nutrition Agent ✨</h3>

          <p>
            Your personal nutrition assistant. Search foods,
            analyse your nutrition and manage your food diary.
          </p>
        </div>

        <button
          type="button"
          className="ai-clear-button"
          onClick={clearChat}
          disabled={loading}
        >
          Clear Chat
        </button>
      </div>

      {/* Chat messages */}
      <div className="ai-chat-messages" aria-live="polite">
        {messages.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            className={`ai-message-wrapper ${item.role}`}
          >
            <div className="ai-message-avatar">
              {item.role === "assistant" ? "🤖" : "👤"}
            </div>

            <div className="ai-message-content">
              <div className={`ai-message ${item.role}`}>
                {item.content}
              </div>

              <span className="ai-message-time">
                {formatTime(item.time)}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="ai-message-wrapper assistant">
            <div className="ai-message-avatar">🤖</div>

            <div className="ai-message assistant ai-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {/* Pending food confirmation */}
      {pendingAction && (
        <div className="ai-confirmation">
          <div className="ai-confirmation-heading">
            <span className="ai-confirmation-icon">🥗</span>

            <div>
              <h4>Confirm Food Diary Update</h4>
              <p>Please review the details before saving.</p>
            </div>
          </div>

          <div className="ai-food-details">
            <div>
              <span>Food</span>
              <strong>
                {pendingAction.foodName || "Selected food"}
              </strong>
            </div>

            <div>
              <span>Quantity</span>
              <strong>
                {pendingAction.quantityGrams} g
              </strong>
            </div>

            <div>
              <span>Meal</span>
              <strong>{pendingAction.mealType}</strong>
            </div>
          </div>

          <p className="ai-confirmation-note">
            This food will only be saved to your diary after
            you click Confirm Add.
          </p>

          <div className="ai-confirmation-actions">
            <button
              type="button"
              className="ai-confirm-button"
              onClick={confirmAction}
              disabled={loading}
            >
              {loading ? "Saving..." : "✓ Confirm Add"}
            </button>

            <button
              type="button"
              className="ai-cancel-button"
              onClick={cancelAction}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="ai-error" role="alert">
          <span>⚠️ {error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Chat input */}
      <form className="ai-chat-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={
            pendingAction
              ? "Please confirm or cancel the pending action..."
              : "Ask about nutrition or try: Analyse my nutrition..."
          }
          aria-label="Message the Nutrition Agent"
          disabled={loading || Boolean(pendingAction)}
          maxLength={1500}
        />

        <button
          type="submit"
          disabled={
            loading ||
            Boolean(pendingAction) ||
            !message.trim()
          }
        >
          {loading ? "Wait..." : "Send ➤"}
        </button>
      </form>

      <p className="ai-footer-note">
        BalanceBite AI • Your nutrition companion 💚
      </p>
    </section>
  );
}
