/**
 * Timed interactive ALS practice quiz runner.
 * Loads downloaded IndexedDB question bundles or fallback items, tracks countdown timer with auto-submit,
 * prompts on incomplete submission, and records attempts locally.
 */
import { useState, useEffect, useRef, memo } from "react";
import { h } from "../shared/html.js";
import { fmt } from "../shared/data.js";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from "../shared/icons.js";

/** Isolated 1-second timer badge so ticks do not re-render question cards or choice inputs. */
const QuizTimer = memo(function QuizTimer({ totalSeconds, paused, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (totalSeconds > 0) setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (paused || totalSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, totalSeconds]);

  return h`
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
  `;
});

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
  const setId = p.ctx.set;
  const isCloudSet = typeof setId === "string" && setId.includes("-");
  const cachedBundle =
    (p.offlineBundles || []).find(b => b.id === setId) ||
    (p.onlineBundles || []).find(b => b.id === setId);
  const set = (p.sets || []).find(s => s.id === setId) || cachedBundle || {};

  const [fetchedBundle, setFetchedBundle] = useState(null);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const activeBundle = cachedBundle || (fetchedBundle?.id === setId ? fetchedBundle : null);

  // Load real Supabase questions automatically when an online learner opens an undownloaded published set
  useEffect(() => {
    if (!isCloudSet || cachedBundle || (fetchedBundle?.id === setId)) {
      setLoadingBundle(false);
      setLoadErr("");
      return;
    }

    if (!(p.online || navigator.onLine)) {
      setLoadingBundle(false);
      setLoadErr("This assessment isn't downloaded for offline use yet. Reconnect to the internet or pick an Offline Ready set.");
      return;
    }

    let cancelled = false;
    setLoadingBundle(true);
    setLoadErr("");

    (p.loadSetBundle ? p.loadSetBundle(setId) : Promise.reject(new Error("Question loader unavailable")))
      .then(bundle => {
        if (!cancelled) {
          setFetchedBundle(bundle);
          setLoadingBundle(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setLoadErr(err?.message || "Failed to load assessment questions.");
          setLoadingBundle(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setId, isCloudSet, Boolean(cachedBundle), p.online, retryKey]);

  let qq = [];
  if (activeBundle && Array.isArray(activeBundle.questions) && activeBundle.questions.length > 0) {
    qq = activeBundle.questions;
  } else if (!isCloudSet) {
    qq = p.qs.filter(q => (set.strand_id && q.strand_id === set.strand_id) || q.strand === set.strand);
    if (!qq.length) qq = p.qs.slice(0, 5); // fallback for non-cloud demos only
  }

  const [i, setI] = useState(0);
  const [a, setA] = useState({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [warn, setWarn] = useState("");

  const submitQuiz = () => {
    const sc = qq.filter(x => a[x.id] === x.ans).length;
    const attemptId = createAttemptUuid();
    const resolvedSetId = set.id ?? setId;

    const r = {
      attempt_id: attemptId,
      set: resolvedSetId,
      set_id: resolvedSetId,
      question_set_id: resolvedSetId,
      set_title: set.title || activeBundle?.title || "",
      strand_id: set.strand_id || activeBundle?.strand_id || p.ctx.strand_id || null,
      score: sc,
      total: qq.length,
      date: new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      sync: false,
      ans: a,
      questions: qq
    };

    p.setAtt(prev => [r, ...(prev || [])]);
    p.go("score", { set: resolvedSetId, res: r, questions: qq });
  };

  const submitRef = useRef(submitQuiz);
  submitRef.current = submitQuiz;

  if (loadingBundle) {
    return h`<div class="card mu" style=${{ textAlign: "center", padding: 32, maxWidth: 520, margin: "0 auto", width: "100%" }}>
      <${RefreshCw} size=${28} className="spin" style=${{ color: "var(--pr)", margin: "0 auto 12px auto" }} />
      <b style=${{ fontSize: 15, color: "var(--tx)", display: "block" }}>Loading assessment questions...</b>
      <p style=${{ margin: "6px 0 0 0", fontSize: 13 }}>Fetching approved questions for this set.</p>
    </div>`;
  }

  if (loadErr) {
    return h`<div class="card mu" style=${{ textAlign: "center", padding: 28, maxWidth: 520, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      <${AlertCircle} size=${28} color="var(--bad)" />
      <b style=${{ fontSize: 15, color: "var(--tx)" }}>Unable to Load Quiz</b>
      <p style=${{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>${loadErr}</p>
      <div class="row" style=${{ gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        ${(p.online || navigator.onLine) && h`
          <button type="button" class="btn p" onClick=${() => setRetryKey(k => k + 1)}>
            <${RefreshCw} size=${15} />
            <span>Retry</span>
          </button>
        `}
        <button type="button" class="btn" onClick=${() => p.go("home")}>
          ${p.T("Return to Home")}
        </button>
      </div>
    </div>`;
  }

  const q = qq[i];
  if (!q) {
    return h`<div class="card mu" style=${{ textAlign: "center", padding: 24 }}>
      <p style=${{ fontSize: 14, fontWeight: 600 }}>No approved questions available for this set.</p>
      <button type="button" class="btn p" style=${{ marginTop: 12 }} onClick=${() => p.go("home")}>
        ${p.T("Return to Home")}
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
      <${QuizTimer}
        totalSeconds=${qq.length * 60}
        paused=${loadingBundle || Boolean(loadErr)}
        onExpire=${() => submitRef.current()}
      />
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
      <div class="row" style=${{ justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        <button 
          type="button"
          class="btn d" 
          style=${{ flex: "1 1 130px" }} 
          onClick=${submitQuiz}
        >
          ${p.T("Confirm Submit")}
        </button>
        <button 
          type="button"
          class="btn" 
          style=${{ flex: "1 1 130px" }} 
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
