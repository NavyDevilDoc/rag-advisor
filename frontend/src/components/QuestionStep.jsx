export default function QuestionStep({ stepData, answers, onAnswer }) {
  return (
    <>
      <div
        style={{
          fontSize: 12,
          color: "#475569",
          fontFamily: "system-ui",
          marginBottom: 18,
          letterSpacing: "0.02em",
        }}
      >
        {stepData.subtitle}
      </div>

      {stepData.questions.map((q) => (
        <div
          key={q.id}
          style={{
            background: "#0f172a",
            border: "1px solid #1e2d42",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#e2e8f0",
              marginBottom: 12,
              fontFamily: "system-ui",
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            {q.text}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onAnswer(q.id, opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 7,
                    cursor: "pointer",
                    textAlign: "left",
                    border: `1.5px solid ${selected ? "#3b82f6" : "#1e293b"}`,
                    background: selected ? "#0c1a4e" : "#080f1a",
                    transition: "all 0.12s ease",
                    fontFamily: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                      marginTop: 1,
                      border: `2px solid ${selected ? "#3b82f6" : "#334155"}`,
                      background: selected ? "#3b82f6" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: selected ? "#93c5fd" : "#cbd5e1",
                        marginBottom: 2,
                      }}
                    >
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        fontFamily: "system-ui",
                        lineHeight: 1.4,
                      }}
                    >
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
