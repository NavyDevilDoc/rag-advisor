import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { STEPS } from "./data/questions.js";
import QuestionStep from "./components/QuestionStep.jsx";
import ResultsPage from "./components/ResultsPage.jsx";
import { PAGE, BTN_PRIMARY, BTN_OUTLINE } from "./styles/tokens.js";

export default function RAGAdvisor() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  // Snap to top on every step transition (Next, Back, Start Over, → results).
  // Otherwise the user lands mid-page after clicking through the wizard.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const totalSteps = STEPS.length;
  const onResults = step === totalSteps;
  const currentStepData = STEPS[step];
  const stepAnswered = !onResults && currentStepData.questions.every((q) => answers[q.id] !== undefined);
  const onLastStep = step === totalSteps - 1;

  function handleAnswer(qId, val) {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }

  function handleNext() {
    setStep((s) => (onLastStep ? totalSteps : s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
  }

  if (onResults) {
    return (
      <div style={PAGE}>
        <Header />
        <ResultsPage answers={answers} onReset={handleReset} />
      </div>
    );
  }

  const progress = (step / totalSteps) * 100;

  return (
    <div style={PAGE}>
      <Header />
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.08em" }}>
              STEP {step + 1} OF {totalSteps} · {currentStepData.title.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: "#334155" }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#3b82f6",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <QuestionStep stepData={currentStepData} answers={answers} onAnswer={handleAnswer} />

        {/* Nav */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {step > 0 && (
            <button onClick={handleBack} style={BTN_OUTLINE}>
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!stepAnswered}
            style={{
              ...BTN_PRIMARY,
              flex: 1,
              opacity: stepAnswered ? 1 : 0.4,
              cursor: stepAnswered ? "pointer" : "not-allowed",
            }}
          >
            {onLastStep ? "Get Recommendation" : "Next"}
            <ChevronRight size={15} />
          </button>
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#334155",
            fontFamily: "system-ui",
            textAlign: "center",
            marginTop: 14,
            lineHeight: 1.5,
          }}
        >
          Answer all questions on this step to continue
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "#475569",
          textTransform: "uppercase",
          marginBottom: 5,
        }}
      >
        RAG Architecture Advisor
      </div>
      <h1
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#f1f5f9",
          margin: 0,
          letterSpacing: "0.04em",
        }}
      >
        Find Your Optimal Architecture
      </h1>
      <div
        style={{
          fontSize: 11,
          color: "#334155",
          marginTop: 6,
          fontFamily: "system-ui",
        }}
      >
        12 questions · Standard · Graph · Agentic
      </div>
    </div>
  );
}
