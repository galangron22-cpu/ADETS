import { h } from "../shared/html.js";
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Home, 
  Sparkles, 
  Lightbulb, 
  Award, 
  AlertCircle 
} from "../shared/icons.js";

export function Score(p) {
  const r = p.ctx.res || {};
  const set = (p.sets || []).find(s => s.id === r.set) || {};
  const qq = p.ctx.questions || r.questions || p.qs.slice(0, r.total || 5);

  const percentage = r.total ? Math.round((r.score / r.total) * 100) : 0;
  const isPassing = percentage >= 75;

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 14 }}>
    <h2>${p.T("Assessment Results")}</h2>

    <!-- Prominent Score Card -->
    <div class="card" style=${{ 
      textAlign: "center", 
      padding: "24px 20px",
      background: isPassing 
        ? "linear-gradient(145deg, var(--card), var(--ok-bg))" 
        : "linear-gradient(145deg, var(--card), var(--bad-bg))",
      border: `1.5px solid ${isPassing ? "var(--ok)" : "var(--bad)"}`,
      boxShadow: "var(--shadow-sm)"
    }}>
      <div style=${{ 
        width: 48, 
        height: 48, 
        borderRadius: "50%", 
        background: isPassing ? "var(--ok)" : "var(--bad)", 
        color: "#ffffff", 
        display: "inline-flex", 
        alignItems: "center", 
        justifyContent: "center",
        marginBottom: 8
      }}>
        <${isPassing ? Award : AlertCircle} size=${26} />
      </div>

      <div style=${{ fontSize: 13, color: "var(--mu)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
        ${p.T("Final Score")}
      </div>
      <div style=${{ fontSize: 36, fontWeight: 900, margin: "6px 0", color: "var(--tx)", letterSpacing: "-0.03em" }}>
        ${r.score} <span style=${{ fontSize: 20, fontWeight: 500, color: "var(--mu)" }}>/ ${r.total}</span>
      </div>

      <div class="badge ${isPassing ? "on" : "off"}" style=${{ fontSize: 13, padding: "5px 14px", fontWeight: 700 }}>
        <${isPassing ? CheckCircle2 : AlertCircle} size=${14} />
        <span>${isPassing ? p.T("Target Met: 75%+ Passed") : p.T("Needs Review: Below 75% Target")}</span>
      </div>
      
      <p class="mu" style=${{ marginTop: 10, fontSize: 12.5 }}>
        ${isPassing 
          ? p.T("Great job! You met the passing standard for this ALS Learning Strand.") 
          : p.T("Keep reviewing your lessons and attempt this reviewer set again to build mastery.")}
      </p>
    </div>

    <!-- Review Answers Section -->
    <div class="card" style=${{ display: "flex", flexDirection: "column", gap: 14 }}>
      <b style=${{ fontSize: 15 }}>${p.T("Review Answers & Explanations")}</b>

      ${qq.map((q, k) => {
        const userChoice = r.ans ? r.ans[q.id] : undefined;
        const ok = userChoice === q.ans;

        return h`<div style=${{ 
          padding: "14px", 
          borderRadius: "var(--radius)", 
          background: "var(--bg)",
          border: `1px solid ${ok ? "rgba(18, 161, 80, 0.2)" : "rgba(217, 45, 32, 0.2)"}`,
          display: "flex", 
          flexDirection: "column", 
          gap: 8 
        }}>
          <div class="row sp" style=${{ alignItems: "flex-start", gap: 10 }}>
            <span style=${{ fontSize: 13.5, flex: 1, lineHeight: 1.45 }}>
              <b>Q${k + 1}.</b> ${q.text}
            </span>
            <span class="badge ${ok ? "on" : "off"}" style=${{ whiteSpace: "nowrap", flexShrink: 0 }}>
              <${ok ? CheckCircle2 : XCircle} size=${12} />
              <span>${ok ? p.T("Correct") : "Your: " + ("ABCD"[userChoice] || "–")}</span>
            </span>
          </div>

          <div style=${{ fontSize: 12.5, fontWeight: 600, color: ok ? "var(--ok)" : "var(--bad)" }}>
            ${ok 
              ? `${p.T("Correct answer")}: ${"ABCD"[q.ans]}. ${q.choices[q.ans]}` 
              : `${p.T("Correct answer was")} ${"ABCD"[q.ans]}. ${q.choices[q.ans]}`}
          </div>

          <div style=${{ 
            fontSize: 12.5, 
            background: "var(--card)", 
            padding: "10px 12px", 
            borderRadius: 8, 
            border: "1px solid var(--bd)",
            display: "flex", 
            alignItems: "flex-start", 
            gap: 8,
            color: "var(--tx)",
            lineHeight: 1.45
          }}>
            <${Lightbulb} size=${16} color="var(--pr)" style=${{ flexShrink: 0, marginTop: 2 }} />
            <span>${q.exp || q.explanation || "DepEd ALS explanation not available."}</span>
          </div>

          <button 
            type="button"
            class="btn" 
            style=${{ alignSelf: "flex-start", fontSize: 12, padding: "6px 12px", gap: 6 }} 
            onClick=${() => p.go("chat", { ask: `Can you explain why the correct answer to this question is "${"ABCD"[q.ans]}": "${q.text}"?` })}
          >
            <${Sparkles} size=${13} color="var(--pr)" />
            <span>${p.T("Ask AI Tutor about this question")}</span>
          </button>
        </div>`;
      })}
    </div>

    <!-- Action Buttons -->
    <div class="row" style=${{ gap: 10 }}>
      <button 
        type="button"
        class="btn" 
        style=${{ flex: 1 }}
        onClick=${() => p.go("quiz", { set: set.id || r.set, n: Math.random() })}
      >
        <${RotateCcw} size=${15} />
        <span>${p.T("Retake Assessment")}</span>
      </button>
      <button 
        type="button"
        class="btn p" 
        style=${{ flex: 1 }}
        onClick=${() => p.go("home")}
      >
        <${Home} size=${15} />
        <span>${p.T("Return to Home")}</span>
      </button>
    </div>
  </div>`;
}
