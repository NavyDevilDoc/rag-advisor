import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Plus } from "lucide-react";
import { COLORS, FONTS } from "../styles/tokens.js";
import { track } from "../utils/analytics.js";

const API_BASE = import.meta.env.VITE_API_URL || "";
const SESSION_KEY = "ragAdvisor.feedbackSubmitted.v1";

export default function FeedbackWidget({ recommendation, confidence }) {
  // Skip rendering entirely if the user already gave feedback in this tab.
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
  });
  // Tracks which thumb the user picked (null = not yet picked).
  const [helpful, setHelpful] = useState(null);
  // Whether the optional-comment textarea has been opened.
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (hidden) return null;

  async function postFeedback(payload) {
    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Network failure — silently degrade. Signal will be lost; not worth
      // showing the user an error for a non-essential feature.
    }
  }

  // Thumb click is the complete feedback action. We POST immediately and
  // persist the session flag so a refresh doesn't re-prompt them. The
  // optional comment is genuinely optional — they can leave without it.
  async function handleThumb(value) {
    setHelpful(value);
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    track("Feedback Submitted", { helpful: value ? "yes" : "no" });
    await postFeedback({
      helpful: value,
      recommendation,
      confidence,
    });
  }

  async function handleSendComment() {
    if (!comment.trim() || sending) return;
    setSending(true);
    await postFeedback({
      helpful,
      comment: comment.trim().slice(0, 500),
      recommendation,
      confidence,
    });
    setCommentSent(true);
    setSending(false);
  }

  return (
    <div
      className="print-hide"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.textDim,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Was this helpful?
      </div>

      {/* Thumb buttons — always rendered, the picked one shows selected state */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: helpful === null ? 0 : 14,
        }}
      >
        <ThumbBtn
          icon={<ThumbsUp size={13} />}
          label="Helpful"
          selected={helpful === true}
          disabled={helpful !== null}
          onClick={() => handleThumb(true)}
          accent={COLORS.good}
        />
        <ThumbBtn
          icon={<ThumbsDown size={13} />}
          label="Not for me"
          selected={helpful === false}
          disabled={helpful !== null}
          onClick={() => handleThumb(false)}
          accent={COLORS.warning}
        />
      </div>

      {/* After thumb: confirmation + optional progressive-disclosure comment */}
      {helpful !== null && !commentSent && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: COLORS.good,
              fontFamily: FONTS.sans,
              marginBottom: showCommentBox ? 12 : 8,
            }}
          >
            <Check size={13} /> Thanks for the feedback.
          </div>

          {!showCommentBox && (
            <button
              onClick={() => setShowCommentBox(true)}
              style={addCommentBtnStyle}
            >
              <Plus size={11} /> Add a one-line comment?
            </button>
          )}

          {showCommentBox && (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="e.g. close call but I expected Graph to win because..."
                rows={2}
                autoFocus
                style={textareaStyle}
              />
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={handleSendComment}
                  disabled={!comment.trim() || sending}
                  style={{
                    ...sendBtnStyle,
                    opacity: !comment.trim() || sending ? 0.4 : 1,
                    cursor: !comment.trim() || sending ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {commentSent && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: COLORS.good,
            fontFamily: FONTS.sans,
            marginTop: 4,
          }}
        >
          <Check size={13} /> Got it — thanks for the note.
        </div>
      )}
    </div>
  );
}

function ThumbBtn({ icon, label, selected, disabled, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "inherit",
        letterSpacing: "0.04em",
        color: selected ? accent : COLORS.textSecondary,
        background: selected ? `${accent}18` : COLORS.bg,
        border: `1px solid ${selected ? accent : COLORS.border}`,
        borderRadius: 6,
        cursor: disabled && !selected ? "not-allowed" : "pointer",
        opacity: disabled && !selected ? 0.4 : 1,
        transition: "color 0.15s, border-color 0.15s, background 0.15s",
      }}
    >
      {icon} {label}
    </button>
  );
}

const addCommentBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 0",
  fontSize: 11,
  fontWeight: 500,
  fontFamily: "inherit",
  color: COLORS.textMuted,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationColor: `${COLORS.textDim}80`,
  textUnderlineOffset: 3,
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: FONTS.sans,
  fontSize: 12,
  padding: "8px 10px",
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  color: COLORS.textPrimary,
  resize: "vertical",
  outline: "none",
};

const sendBtnStyle = {
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  color: "#fff",
  background: COLORS.primaryDeep,
  border: "none",
  borderRadius: 6,
};
