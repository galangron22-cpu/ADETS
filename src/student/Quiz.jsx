/**
 * Timed interactive ALS practice quiz runner.
 * Loads downloaded IndexedDB question bundles or fallback items, tracks countdown timer with auto-submit,
 * prompts on incomplete submission, and records attempts locally.
 */
import { useState, useEffect } from "react";
import { h } from "../shared/html.js";
import { fmt } from "../shared/data.js";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle 
} from "../shared/icons.js";

/** Generates an RFC-4122 v4 UUID even on non-HTTPS origins where `crypto.randomUUID` is unavailable. */
function createAttemptUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let idx = 0; idx < 16; idx++) {
      bytes[idx] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function Quiz(p) {
  // Check if there is an offline bundle for this set
  const offlineBundle = (p.offlineBundles || []).find(b => b.id === p.ctx.set);
  const set = (p.sets || []).find(s => s.id === p.ctx.set) || offlineBundle || {};

  let qq = [];
  if (offlineBundle && offlineBundle.questions && offlineBundle.questions.length > 0) {
    qq = offlineBundle.questions;
  } else {
    qq = p.qs.filter(q => (set.strand_id && q.strand_id === set.strand_id) || q.strand === set.strand);
    if (!qq.length) qq = p.qs.slice(0, 5); // fallback
  }

  const [i, setI] = useState(0);
  const [a, setA] = useState({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [timeLeft, setTimeLeft] = useState(qq.length * 60); // 1 min per question
  const [warn, setWarn] = useState("");

  const submitQuiz = () => {
    const sc = qq.filter(x => a[x.id] === x.ans).length;
    const attemptId = createAttemptUuid();
    const setId = set.id ?? p.ctx.set;

    const r = {
      attempt_id: attemptId,
      set: setId,
      set_id: setId,
      question_set_id: setId,
      strand_id: set.strand_id || (offlineBundle && offlineBundle.strand_id) || p.ctx.strand_id || null,
      score: sc,
      total: qq.length,
      date: new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      sync: false,
      ans: a,
      questions: qq
    };

    p.setAtt([r, ...p.att]);
    p.go("score", { set: setId, res: r, questions: qq });
  };

  // Timer & TC-QUIZ-04: Auto-submit when timer reaches 00:00
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qq, a]);

  const q = qq[i];
  if (!q) {
    return h`<div class="card mu" style=${{ textAlign: "center", padding: 24 }}>
      <p style=${{ fontSize: 14, fontWeight: 600 }}>No approved questions available for this set.</p>
      <button class="btn p" style=${{ marginTop: 12 }} onClick=${() => p.go("home")}>
        Return to Home
      </button>
    </div>`;
  }

  // TC-QUIZ-03: Prompt before submitting with unanswered questions
  const handleSubmitClick = () => {
    const answeredCount = Object.keys(a).length;
    if (answeredCount < qq.length) {
      setWarn(`You answered ${answeredCount} of ${qq.length} questions. Submit anyway?`);
      return;
    }
    submitQuiz();
  };

  const isLastQuestion = i === qq.length - 1;

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 840, margin: "0 auto", width: "100%" }}>
    <!-- Header with Question Tracker & Timer -->
    <div class="row sp" style=${{ padding: "4px 0" }}>
      <div class="row" style=${{ gap: 8 }}>
        <span class="badge" style=${{ fontSize: 13, fontWeight: 700 }}>
          ${p.T("Question")} ${i + 1} ${p.T("of")} ${qq.length}
        </span>
      </div>
      <div 
        class="badge" 
        style=${{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: 6, 
          fontSize: 13, 
          fontWeight: 700,
          color: timeLeft <= 60 ? "var(--bad)" : "inherit",
          borderColor: timeLeft <= 60 ? "var(--bad)" : "var(--bd)"
        }}
      >
        <${Clock} size=${14} />
        <span style=${{ fontVariantNumeric: "tabular-nums" }}>${fmt(timeLeft)}</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="bar" style=${{ height: 6 }}>
      <i style=${{ width: ((i + 1) / qq.length * 100) + "%" }}></i>
    </div>

    <!-- Question Card -->
    <div class="card" style=${{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div class="row sp">
        <span class="badge ${q.diff === "Hard" ? "off" : "on"}" style=${{ fontSize: 11 }}>
          ${q.diff || "Medium"} Difficulty
        </span>
      </div>
      <p style=${{ fontSize: 16, margin: "6px 0 0 0", lineHeight: 1.55, fontWeight: 600, color: "var(--tx)" }}>
        ${q.text}
      </p>
    </div>

    <!-- Radio Button Choices -->
    <div style=${{ display: "flex", flexDirection: "column", gap: 10 }}>
      ${q.choices.map((c, k) => h`
        <label 
          class="ch ${a[q.id] === k ? "sel" : ""}" 
          style=${{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}
        >
          <input 
            type="radio" 
            name=${"q_" + q.id} 
            value=${k}
            checked=${a[q.id] === k}
            onChange=${() => { setA({ ...a, [q.id]: k }); setWarn(""); }}
            style=${{ width: 18, height: 18, accentColor: "var(--pr)", cursor: "pointer", margin: 0 }}
          />
          <span style=${{ flex: 1, fontSize: 14.5, lineHeight: 1.4 }}>
            <b style=${{ color: "var(--pr)", marginRight: 6 }}>${"ABCD"[k]}.</b> ${c}
          </span>
        </label>
      `)}
    </div>

    <!-- Navigation Buttons -->
    <div class="row" style=${{ gap: 10, marginTop: 4 }}>
      <button 
        type="button"
        class="btn" 
        style=${{ flex: 1 }}
        disabled=${i === 0} 
        onClick=${() => { setI(i - 1); setWarn(""); }}
      >
        <${ChevronLeft} size=${16} />
        <span>${p.T("Previous")}</span>
      </button>

      ${isLastQuestion ? h`
        <button 
          type="button"
          class="btn p" 
          style=${{ flex: 1 }}
          onClick=${handleSubmitClick}
        >
          <${CheckCircle2} size=${16} />
          <span>${p.T("Finish & Submit")}</span>
        </button>
      ` : h`
        <button 
          type="button"
          class="btn p" 
          style=${{ flex: 1 }}
          onClick=${() => { setI(i + 1); setWarn(""); }}
        >
          <span>${p.T("Next")}</span>
          <${ChevronRight} size=${16} />
        </button>
      `}
    </div>

    <!-- Submit warning confirmation banner -->
    ${warn && h`<div class="card" style=${{ 
      background: "var(--sf)", 
      border: "1px solid var(--bd)", 
      textAlign: "center", 
      display: "flex", 
      flexDirection: "column", 
      gap: 12,
      padding: 16
    }}>
      <div class="row" style=${{ justifyContent: "center", gap: 8, color: "var(--bad)" }}>
        <${AlertCircle} size=${18} />
        <b style=${{ fontSize: 13.5 }}>${warn}</b>
      </div>
      <div class="row" style=${{ justifyContent: "center", gap: 10 }}>
        <button 
          type="button"
          class="btn d" 
          style=${{ flex: 1 }} 
          onClick=${submitQuiz}
        >
          ${p.T("Confirm Submit")}
        </button>
        <button 
          type="button"
          class="btn" 
          style=${{ flex: 1 }} 
          onClick=${() => setWarn("")}
        >
          ${p.T("Keep Reviewing")}
        </button>
      </div>
    </div>`}

    <!-- Early submit link if not on last question -->
    ${!isLastQuestion && h`
      <div style=${{ textAlign: "center", marginTop: 4 }}>
        <button 
          type="button"
          style=${{ 
            background: "none", 
            border: "none", 
            color: "var(--mu)", 
            fontSize: 12.5, 
            cursor: "pointer", 
            textDecoration: "underline" 
          }}
          onClick=${handleSubmitClick}
        >
          ${p.T("Submit assessment early")} (${Object.keys(a).length} ${p.T("of")} ${qq.length} ${p.T("answered")})
        </button>
      </div>
    `}

  </div>`;
}
