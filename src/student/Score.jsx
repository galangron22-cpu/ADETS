/**
 * Post-quiz results & answer review view.
 * Triggers celebratory canvas confetti on passing/perfect scores, displays item explanations,
 * and links directly into the AI Study Assistant for question clarification.
 */
import { useEffect, useRef } from "react";
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

function Confetti({ isPerfect }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = isPerfect ? 130 : 65;
    const colors = isPerfect 
      ? ["#f59e0b", "#fbbf24", "#d97706", "#fef08a", "#60a5fa", "#34d399", "#ec4899"]
      : ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ec4899"];

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.4,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2.5,
      speedX: Math.random() * 4 - 2,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 6 - 3,
      opacity: 1
    }));

    let animId;
    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 4000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.04) + p.speedX * 0.25;
        p.rotation += p.rotSpeed;
        if (elapsed > 2800) {
          p.opacity = Math.max(0, 1 - (elapsed - 2800) / 1200);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPerfect]);

  return h`<canvas 
    ref=${canvasRef} 
    style=${{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100%", 
      height: "100%", 
      pointerEvents: "none", 
      zIndex: 9999 
    }} 
  />`;
}

export function Score(p) {
  const r = p.ctx.res || {};
  const set = (p.sets || []).find(s => s.id === r.set) || {};
  const qq = p.ctx.questions || r.questions || p.qs.slice(0, r.total || 5);

  const percentage = r.total ? Math.round((r.score / r.total) * 100) : 0;
  const isPassing = percentage >= 75;
  const isPerfect = percentage === 100 && r.total > 0;

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 840, margin: "0 auto", width: "100%" }}>
    
    ${isPassing && h`<${Confetti} isPerfect=${isPerfect} />`}

    <h2>${p.T("Assessment Results")}</h2>

    <!-- Perfect Score Banner -->
    ${isPerfect && h`
      <div class="card" style=${{ 
        background: "linear-gradient(135deg, #f59e0b, #d97706)", 
        color: "#ffffff", 
        padding: "14px 20px", 
        borderRadius: 20,
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        gap: 10,
        boxShadow: "0 8px 24px rgba(245, 158, 11, 0.45)",
        animation: "pulseGlow 2s infinite"
      }}>
        <${Sparkles} size=${20} />
        <b style=${{ fontSize: 16, letterSpacing: "0.02em" }}>PERFECT SCORE! 100% ALS CURRICULUM MASTERY</b>
        <${Sparkles} size=${20} />
      </div>
    `}

    <!-- Prominent Score Card -->
    <div class="card" style=${{ 
      textAlign: "center", 
      padding: "26px 20px",
      background: isPassing 
        ? "linear-gradient(145deg, var(--card), var(--ok-bg))" 
        : "linear-gradient(145deg, var(--card), var(--bad-bg))",
      border: `1.5px solid ${isPassing ? "var(--ok)" : "var(--bad)"}`,
      borderRadius: 24,
      boxShadow: "var(--shadow-sm)"
    }}>
      <div style=${{ 
        width: 52, 
        height: 52, 
        borderRadius: "50%", 
        background: isPassing ? "var(--ok)" : "var(--bad)", 
        color: "#ffffff", 
        display: "inline-flex", 
        alignItems: "center", 
        justifyContent: "center",
        marginBottom: 8,
        boxShadow: "var(--shadow-sm)"
      }}>
        <${isPassing ? Award : AlertCircle} size=${28} />
      </div>

      <div style=${{ fontSize: 13, color: "var(--mu)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
        ${p.T("Final Score")}
      </div>
      <div style=${{ fontSize: 40, fontWeight: 800, margin: "6px 0", color: "var(--tx)", letterSpacing: "normal" }}>
        ${r.score} <span style=${{ fontSize: 22, fontWeight: 500, color: "var(--mu)" }}>/ ${r.total}</span>
      </div>

      <div class="badge ${isPassing ? "on" : "off"}" style=${{ fontSize: 13, padding: "6px 16px", fontWeight: 700, borderRadius: 9999 }}>
        <${isPassing ? CheckCircle2 : AlertCircle} size=${14} />
        <span>${isPassing ? p.T("Target Met: 75%+ Passed") : p.T("Needs Review: Below 75% Target")}</span>
      </div>
      
      <p class="mu" style=${{ marginTop: 12, fontSize: 13, lineHeight: 1.45, maxWidth: 500, margin: "12px auto 0 auto" }}>
        ${isPassing 
          ? p.T("Great job! You met the passing standard for this ALS Learning Strand.") 
          : p.T("Keep reviewing your lessons and attempt this reviewer set again to build mastery.")}
      </p>
    </div>

    <!-- Review Answers Section -->
    <div class="card" style=${{ display: "flex", flexDirection: "column", gap: 14, borderRadius: 24, padding: "22px" }}>
      <b style=${{ fontSize: 16 }}>${p.T("Review Answers & Explanations")}</b>

      ${qq.map((q, k) => {
        const userChoice = r.ans ? r.ans[q.id] : undefined;
        const ok = userChoice === q.ans;

        return h`<div style=${{ 
          padding: "16px", 
          borderRadius: 18, 
          background: "var(--bg)",
          border: `1.5px solid ${ok ? "rgba(18, 161, 80, 0.25)" : "rgba(217, 45, 32, 0.25)"}`,
          display: "flex", 
          flexDirection: "column", 
          gap: 10 
        }}>
          <div class="row sp" style=${{ alignItems: "flex-start", gap: 10 }}>
            <span style=${{ fontSize: 14, flex: 1, lineHeight: 1.5 }}>
              <b>Q${k + 1}.</b> ${q.text}
            </span>
            <span class="badge ${ok ? "on" : "off"}" style=${{ whiteSpace: "nowrap", flexShrink: 0, borderRadius: 9999 }}>
              <${ok ? CheckCircle2 : XCircle} size=${13} />
              <span>${ok ? p.T("Correct") : "Your: " + ("ABCD"[userChoice] || "–")}</span>
            </span>
          </div>

          <div style=${{ fontSize: 13, fontWeight: 700, color: ok ? "var(--ok)" : "var(--bad)" }}>
            ${ok 
              ? `${p.T("Correct answer")}: ${"ABCD"[q.ans]}. ${q.choices[q.ans]}` 
              : `${p.T("Correct answer was")} ${"ABCD"[q.ans]}. ${q.choices[q.ans]}`}
          </div>

          <div style=${{ 
            fontSize: 13, 
            background: "var(--card)", 
            padding: "12px 14px", 
            borderRadius: 12, 
            border: "1px solid var(--bd)",
            display: "flex", 
            alignItems: "flex-start", 
            gap: 10,
            color: "var(--tx)",
            lineHeight: 1.5
          }}>
            <${Lightbulb} size=${17} color="var(--pr)" style=${{ flexShrink: 0, marginTop: 2 }} />
            <span>${q.exp || q.explanation || "DepEd ALS explanation not available."}</span>
          </div>

          <button 
            type="button"
            class="btn" 
            style=${{ alignSelf: "flex-start", fontSize: 12.5, padding: "8px 14px", gap: 6, borderRadius: 9999 }} 
            onClick=${() => p.go("chat", { ask: `Can you explain why the correct answer to this question is "${"ABCD"[q.ans]}": "${q.text}"?` })}
          >
            <${Sparkles} size=${14} color="var(--pr)" />
            <span>${p.T("Ask AI Tutor about this question")}</span>
          </button>
        </div>`;
      })}
    </div>

    <!-- Action Buttons -->
    <div class="row" style=${{ gap: 12 }}>
      <button 
        type="button" 
        class="btn" 
        style=${{ flex: 1, padding: "12px", borderRadius: 9999 }}
        onClick=${() => p.go("quiz", { set: set.id || r.set, n: Math.random() })}
      >
        <${RotateCcw} size=${16} />
        <span>${p.T("Retake Assessment")}</span>
      </button>
      <button 
        type="button" 
        class="btn p" 
        style=${{ flex: 1, padding: "12px", borderRadius: 9999 }}
        onClick=${() => p.go("home")}
      >
        <${Home} size=${16} />
        <span>${p.T("Return to Home")}</span>
      </button>
    </div>
  </div>`;
}
