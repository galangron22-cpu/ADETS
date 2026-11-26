/**
 * Alamin AI Study Assistant chat interface.
 * Lets authenticated learners ask ALS questions online via `/api/ai/chat`, renders Markdown replies,
 * validates input limits, and provides quick topic suggestions.
 */
import { useState, useEffect, useRef } from "react";
import { h } from "../shared/html.js";
import { fetchApi } from "../shared/supabase.js";
import { formatMarkdown } from "../shared/format.js";
import { 
  Bot, 
  User, 
  Send, 
  ChevronLeft, 
  Sparkles, 
  WifiOff, 
  AlertCircle 
} from "../shared/icons.js";

const SUGGESTIONS = [
  "Explain Photosynthesis in Filipino (LS2)",
  "How to solve fraction additions (LS3)",
  "Subject-verb agreement rules (LS1)",
  "Employee rights in the Philippines (LS4)"
];

export function Chat(p) {
  const [m, setM] = useState([
    {
      b: 1,
      t: "Kumusta! Ako ang iyong **Alamin Study Assistant**.\n\nHanda akong tulungan ka sa paghahanda para sa iyong ALS A&E exam sa limang **Learning Strands**:\n* **LS1:** Communication Skills (English & Filipino)\n* **LS2:** Scientific Literacy & Critical Thinking\n* **LS3:** Mathematical & Problem Solving\n* **LS4:** Life & Career Skills\n* **LS5:** Understanding the Self & Society\n\nMayroon ka bang aralin o tanong na nais nating pag-aralan ngayon?"
    }
  ]);
  const [v, setV] = useState(p.ctx.ask || "");
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState("");
  const end = useRef();

  useEffect(() => {
    end.current && end.current.scrollIntoView({ behavior: "smooth" });
  }, [m, loading]);

  const send = async (textToSend) => {
    setWarn("");
    const text = (typeof textToSend === "string" ? textToSend : v).trim();

    // TC-BOT-04: Empty message validation
    if (!text) return;

    // TC-BOT-02: Offline check
    if (!p.online) {
      setWarn("Chatbot unavailable offline – connect to internet.");
      return;
    }

    // TC-BOT-05: 500-character boundary limit
    if (text.length > 500) {
      setWarn("Maximum 500 characters");
      return;
    }

    setM(x => [...x, { t: text }]);
    setV("");
    setLoading(true);

    try {
      const res = await fetchApi("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: text })
      });
      setM(x => [...x, { b: 1, t: res.reply }]);
    } catch (err) {
      // Offline fallback if network dropped mid-call
      setM(x => [
        ...x,
        { b: 1, t: "Paumanhin, nagkaroon ng aberya sa koneksyon: " + (err.message || "Pakisubukang muli.") }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return h`<div style=${{ display: "flex", flexDirection: "column", minHeight: "80vh", maxWidth: 920, margin: "0 auto", width: "100%", gap: 14 }}>
    <!-- Header -->
    <!-- Chat Header Bar -->
    <div class="row sp" style=${{ 
      paddingBottom: 10, 
      borderBottom: "1px solid var(--bd)",
      alignItems: "center"
    }}>
      <button 
        type="button"
        class="ios-round-btn" 
        onClick=${() => p.go("home")}
        title="Back to Home"
      >
        <${ChevronLeft} size=${18} />
      </button>

      <div class="row" style=${{ gap: 10, alignItems: "center" }}>
        <img 
          src="/chatbot-profile-image.png" 
          alt="Alamin AI Tutor" 
          style=${{ 
            width: 38, 
            height: 38, 
            borderRadius: "50%", 
            objectFit: "cover", 
            boxShadow: "var(--shadow-xs)",
            border: "1.5px solid var(--sf)"
          }} 
        />
        <div>
          <b style=${{ fontSize: 15, display: "block", lineHeight: 1.2 }}>Alamin AI Tutor</b>
          <span style=${{ fontSize: 11.5, color: p.online ? "var(--ok)" : "var(--mu)", fontWeight: 500 }}>
            ${p.online ? "● Active Study Companion" : "○ Offline"}
          </span>
        </div>
      </div>

      <div style=${{ width: 38 }}></div>
    </div>

    <!-- Chat Message List -->
    <div style=${{ 
      flex: 1, 
      overflowY: "auto", 
      display: "flex", 
      flexDirection: "column", 
      gap: 12, 
      paddingRight: 4 
    }}>
      ${m.map(x => h`
        <div class="msg-row ${x.b ? "bot" : "user"}">
          <div class="avatar ${x.b ? "bot" : "user"}">
            ${x.b 
              ? h`<img src="/chatbot-profile-image.png" alt="Bot" style=${{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />` 
              : h`<${User} size=${16} />`}
          </div>
          <div 
            class="msg ${x.b ? "b" : "u"}" 
            dangerouslySetInnerHTML=${{ __html: formatMarkdown(x.t) }} 
          />
        </div>
      `)}

      ${loading && h`
        <div class="msg-row bot">
          <div class="avatar bot">
            <img src="/chatbot-profile-image.png" alt="Bot" style=${{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          </div>
          <div class="msg b" style=${{ display: "flex", alignItems: "center", gap: 6, fontStyle: "italic", opacity: 0.85 }}>
            <${Sparkles} size=${14} />
            <span>Naghahanda ng paliwanag ang assistant...</span>
          </div>
        </div>
      `}

      ${warn && h`
        <div class="badge off" style=${{ alignSelf: "center", padding: "8px 14px", gap: 6 }}>
          <${AlertCircle} size=${14} />
          <span>${warn}</span>
        </div>
      `}

      ${!p.online && h`
        <div class="card mu" style=${{ textAlign: "center", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <${WifiOff} size=${22} color="var(--bad)" />
          <b style=${{ color: "var(--tx)" }}>${p.T("AI Assistant is offline")}</b>
          <span style=${{ fontSize: 12.5 }}>${p.T("Connect to Wi-Fi or mobile data to consult your study tutor.")}</span>
        </div>
      `}

      <div ref=${end}></div>
    </div>

    <!-- Suggested Topics Chips (shown when few messages) -->
    ${m.length <= 2 && p.online && h`
      <div style=${{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span class="mu" style=${{ fontSize: 11.5, fontWeight: 600 }}>${p.T("Suggested ALS Topics:")}</span>
        <div class="chips">
          ${SUGGESTIONS.map(s => h`
            <button 
              type="button" 
              class="chip" 
              onClick=${() => send(s)}
            >
              <${Sparkles} size=${11} color="var(--pr)" />
              <span>${p.T(s)}</span>
            </button>
          `)}
        </div>
      </div>
    `}

    <!-- Input Bar -->
    <div class="row" style=${{ gap: 8 }}>
      <input 
        class="in g" 
        placeholder=${p.T("Type your ALS study question (max 500 chars)...")} 
        value=${v} 
        disabled=${!p.online || loading}
        onInput=${e => { setV(e.target.value); setWarn(""); }} 
        onKeyDown=${e => e.key === "Enter" && !loading && send()}
      />
      <button 
        type="button"
        class="btn p" 
        disabled=${!p.online || loading || !v.trim()} 
        onClick=${() => send()}
        style=${{ padding: "11px 16px" }}
        title="Send question"
      >
        <${Send} size=${16} />
      </button>
    </div>

    <span class="mu" style=${{ textAlign: "center", fontSize: 11 }}>
      ${p.T("Curriculum-restricted to DepEd ALS Learning Strands (LS1–LS5). Powered by Google Gemini.")}
    </span>
  </div>`;
}
