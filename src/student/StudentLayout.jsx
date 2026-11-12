import { useState, useEffect } from "react";
import { h } from "../shared/html.js";
import { L, S, TOP, sets_of } from "../shared/data.js";
import { supabase } from "../shared/supabase.js";
import { Login } from "./Login.jsx";
import { Quiz } from "./Quiz.jsx";
import { Score } from "./Score.jsx";
import { Chat } from "./Chat.jsx";
import { Prog } from "./Progress.jsx";
import {
  Home,
  TrendingUp,
  MessageSquare,
  LogOut,
  Wifi,
  WifiOff,
  Globe,
  BookOpen,
  FlaskConical,
  Calculator,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  DownloadCloud,
  CheckCircle2,
  Trash2,
  Award,
  Sparkles,
  Layers
} from "../shared/icons.js";

// Distinctive icons for each of the 5 ALS Strands
const STRAND_ICONS = [
  BookOpen,       // LS1: Communication Skills
  FlaskConical,   // LS2: Scientific Literacy
  Calculator,     // LS3: Mathematical Skills
  Briefcase,      // LS4: Life & Career Skills
  Globe           // LS5: Understanding Self & Society
];

export function StudentLayout(p) {
  const { T, online, go, scr, user, att, saved, strands = S, sets } = p;

  const Lang = () => h`<button 
    type="button"
    class="pill" 
    onClick=${() => p.setLang(p.lang === "en" ? "fil" : "en")}
    style=${{ fontSize: 12.5 }}
  >
    <${Globe} size=${13} />
    <span>${p.lang === "en" ? "EN | fil" : "en | FIL"}</span>
  </button>`;

  const Badge = () => h`<span class="badge ${online ? "on" : "off"}">
    <${online ? Wifi : WifiOff} size=${12} />
    <span>${T(online ? "Online" : "Offline")}</span>
  </span>`;

  if (scr === "login" || !user) {
    return h`<${Login} ...${p} Lang=${Lang}/>`;
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    p.setUser(null);
    go("login", {});
  };

  const navItems = [
    { label: "Home", id: "home", icon: Home },
    { label: "Progress", id: "progress", icon: TrendingUp },
    { label: "AI Tutor", id: "chat", icon: MessageSquare },
    { label: "Sign Out", id: "logout", icon: LogOut }
  ];

  const nav = h`<nav class="nav">
    ${navItems.map(item => {
      const Icon = item.icon;
      const isActive = scr === item.id;
      return h`<button 
        type="button"
        class=${isActive ? "on" : ""} 
        onClick=${() => item.id === "logout" ? handleLogout() : go(item.id, {})}
      >
        <${Icon} size=${19} />
        <span>${T(item.label)}</span>
      </button>`;
    })}
  </nav>`;

  let body;
  if (scr === "home") {
    const pr = strands.map((s, idx) => {
      const a = att.filter(x => {
        if (x.strand_id && s.strand_id) {
          return x.strand_id === s.strand_id;
        }
        const setStrand = sets_of(p, x.set || x.question_set_id || x.set_id);
        if (setStrand) {
          return setStrand === s.strand_id || setStrand === s.id;
        }
        return false;
      });
      return a.length ? Math.round(a.reduce((t, x) => t + (x.score / x.total), 0) / a.length * 100) : 0;
    });

    const overallProgress = pr.length ? Math.round(pr.reduce((a, b) => a + b, 0) / pr.length) : 0;
    const completedAttemptsCount = att.length;
    const averageScoreOverall = att.length 
      ? Math.round(att.reduce((acc, curr) => acc + (curr.score / curr.total * 100), 0) / att.length) 
      : 0;

    body = h`
      <!-- Learner Welcome Header -->
      <div class="row sp" style=${{ paddingBottom: 6 }}>
        <div class="row" style=${{ gap: 10 }}>
          <div class="avatar user" style=${{ width: 38, height: 38, fontSize: 15 }}>
            ${(user || "L").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style=${{ fontSize: 17 }}>${user}</h3>
            <span class="mu">${T("ALS A&E Candidate")}</span>
          </div>
        </div>
        <div class="row" style=${{ gap: 6 }}>
          <${Badge}/>
          <${Lang}/>
        </div>
      </div>

      <!-- Review Journey Summary Card -->
      <div class="card" style=${{ 
        background: "linear-gradient(145deg, var(--card), var(--sf))", 
        border: "1px solid var(--bd)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div class="row sp" style=${{ marginBottom: 8 }}>
          <span style=${{ fontSize: 13, fontWeight: 700, color: "var(--pr)" }}>${T("OVERALL CURRICULUM MASTERY")}</span>
          <span style=${{ fontSize: 16, fontWeight: 800, color: "var(--tx)" }}>${overallProgress}%</span>
        </div>
        <div class="bar" style=${{ height: 10 }}>
          <i style=${{ width: overallProgress + "%" }}></i>
        </div>

        <div class="row sp" style=${{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--bd)" }}>
          <div style=${{ display: "flex", alignItems: "center", gap: 6 }}>
            <${Award} size=${15} color="var(--pr)" />
            <span style=${{ fontSize: 12.5, fontWeight: 600 }}>${T("Avg")}: ${averageScoreOverall}%</span>
          </div>
          <div style=${{ display: "flex", alignItems: "center", gap: 6 }}>
            <${CheckCircle2} size=${15} color="var(--ok)" />
            <span style=${{ fontSize: 12.5, fontWeight: 600 }}>${completedAttemptsCount} ${T("Quizzes Completed")}</span>
          </div>
        </div>
      </div>

      <!-- AI Assistant Quick Launch -->
      <div 
        class="card" 
        style=${{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          cursor: "pointer",
          border: "1px solid var(--pr)",
          background: "var(--sf)",
          padding: "12px 16px"
        }}
        onClick=${() => go("chat", {})}
      >
        <div style=${{ 
          width: 36, 
          height: 36, 
          borderRadius: 10, 
          background: "var(--pr)", 
          color: "#ffffff", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}>
          <${Sparkles} size=${18} />
        </div>
        <div style=${{ flex: 1 }}>
          <b style=${{ fontSize: 13.5, display: "block" }}>${T("Alamin AI Study Assistant")}</b>
          <span class="mu" style=${{ fontSize: 12 }}>${T("Need help understanding a lesson? Ask any ALS topic.")}</span>
        </div>
        <${ChevronRight} size=${18} color="var(--pr)" />
      </div>

      <!-- Learning Strands Title -->
      <div class="row sp" style=${{ marginTop: 4 }}>
        <h3 style=${{ fontSize: 15, textTransform: "uppercase", letterSpacing: "0.03em" }}>
          ${T("Learning Strands")}
        </h3>
        <span class="mu">${T("5 Core Competencies")}</span>
      </div>

      <!-- Strand Cards List -->
      ${strands.map((s, idx) => {
        const IconComponent = STRAND_ICONS[idx % STRAND_ICONS.length] || BookOpen;
        const progressVal = pr[idx] || 0;
        const strandSetsCount = sets.filter(x => 
          (s.strand_id && x.strand_id === s.strand_id) || 
          x.strand === s.id ||
          x.strand_id === s.id
        ).length;

        return h`
          <div 
            class="strand-card" 
            onClick=${() => go("topics", { strand: idx, strand_id: s.strand_id })}
          >
            <div class="row sp" style=${{ alignItems: "flex-start" }}>
              <div class="row" style=${{ gap: 12, flex: 1 }}>
                <div class="strand-icon-box">
                  <${IconComponent} size=${20} />
                </div>
                <div style=${{ flex: 1 }}>
                  <div class="row sp">
                    <span class="badge" style=${{ fontSize: 11, padding: "1px 8px" }}>
                      ${s.code || `LS${idx + 1}`}
                    </span>
                    <span style=${{ fontSize: 12, fontWeight: 700, color: progressVal >= 75 ? "var(--ok)" : "var(--mu)" }}>
                      ${progressVal}%
                    </span>
                  </div>
                  <b style=${{ fontSize: 14, display: "block", marginTop: 4 }}>
                    ${T(s.rawName || s.name.replace(/^Strand \d+ – /, ""))}
                  </b>
                </div>
              </div>
              <${ChevronRight} size=${18} color="var(--mu)" style=${{ marginTop: 10 }} />
            </div>

            <div class="bar">
              <i style=${{ width: progressVal + "%" }}></i>
            </div>

            <div class="row sp" style=${{ fontSize: 11.5, color: "var(--mu)" }}>
              <span>${strandSetsCount} ${strandSetsCount === 1 ? T("Practice Set") : T("Practice Sets")}</span>
              <span style=${{ color: "var(--pr)", fontWeight: 600 }}>${T("Start Review")}</span>
            </div>
          </div>
        `;
      })}
    `;
  } else if (scr === "topics") {
    const st = strands[p.ctx.strand] || strands[0];
    const strandSets = sets.filter(x => 
      (st.strand_id && x.strand_id === st.strand_id) || 
      x.strand === st.id ||
      x.strand_id === st.id
    );

    const topicList = TOP[p.ctx.strand] || ["General Review", "Practice Test"];

    body = h`
      <!-- Top back navigation -->
      <div class="row sp">
        <button 
          type="button"
          class="btn" 
          style=${{ padding: "6px 12px", fontSize: 13 }}
          onClick=${() => go("home")}
        >
          <${ChevronLeft} size=${16} />
          <span>${st.code || T("Back")}</span>
        </button>
        <${Lang}/>
      </div>

      <div style=${{ marginTop: 4 }}>
        <h2 style=${{ fontSize: 18 }}>${T(st.name.replace(/^Strand \d+ – /, ""))}</h2>
        <span class="mu">${T("Competency Modules & Reviewer Sets")}</span>
      </div>

      <div class="card" style=${{ background: "var(--sf)", padding: "12px 14px" }}>
        <b style=${{ fontSize: 12.5, textTransform: "uppercase", color: "var(--mu)", display: "block", marginBottom: 6 }}>
          ${T("Topics")}
        </b>
        <div class="chips">
          ${topicList.map(t => h`<span class="chip">${T(t)}</span>`)}
        </div>
      </div>

      ${strandSets.length === 0 ? h`
        <div class="card mu" style=${{ textAlign: "center", padding: "32px 16px" }}>
          <${Layers} size=${32} style=${{ margin: "0 auto 8px auto", opacity: 0.5 }} />
          <b>${T("No question sets available yet")}</b>
          <p style=${{ margin: "4px 0 0 0", fontSize: 13 }}>
            ${T("New practice sets will appear here once published by your ALS Teacher.")}
          </p>
        </div>
      ` : strandSets.map(s => {
        const isSaved = saved.includes(s.id);
        const questionCount = s.question_count || 10;

        return h`<div class="card" style=${{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div class="row sp">
            <div>
              <b style=${{ fontSize: 15, display: "block" }}>${s.title}</b>
              <span class="mu" style=${{ fontSize: 12 }}>${T("Version")} ${s.ver || 1} · ${questionCount} ${T("Questions")}</span>
            </div>
            ${isSaved ? h`
              <span class="badge on">
                <${CheckCircle2} size=${12} />
                <span>${T("Offline Ready")}</span>
              </span>
            ` : h`
              <span class="badge">${T("Online Only")}</span>
            `}
          </div>

          <div class="row" style=${{ gap: 8, marginTop: 4 }}>
            ${isSaved ? h`
              <button 
                type="button"
                class="btn d" 
                style=${{ flex: 1 }} 
                onClick=${() => p.removeSet ? p.removeSet(s.id) : p.setSaved(saved.filter(x => x !== s.id))}
              >
                <${Trash2} size=${14} />
                <span>${T("Remove")}</span>
              </button>
            ` : h`
              <button 
                type="button"
                class="btn" 
                style=${{ flex: 1 }} 
                disabled=${!online} 
                onClick=${() => p.downloadSet ? p.downloadSet(s.id) : (p.setSaved([...saved, s.id]), p.say("Downloaded for offline"))}
              >
                <${DownloadCloud} size=${14} />
                <span>${T("Download for Offline")}</span>
              </button>
            `}
            <button 
              type="button"
              class="btn p" 
              style=${{ flex: 1 }} 
              disabled=${!isSaved && !online} 
              onClick=${() => go("quiz", { set: s.id, strand_id: st.strand_id })}
            >
              <span>${T("Start Quiz")}</span>
              <${ArrowRight} size=${14} />
            </button>
          </div>
        </div>`;
      })}
    `;
  } else if (scr === "quiz") {
    body = h`<${Quiz} ...${p} key=${p.ctx.set + "-" + (p.ctx.n || 0)}/>`;
  } else if (scr === "score") {
    body = h`<${Score} ...${p}/>`;
  } else if (scr === "chat") {
    body = h`<${Chat} ...${p} Badge=${Badge}/>`;
  } else if (scr === "progress") {
    body = h`<${Prog} ...${p}/>`;
  }

  return h`<div class="phone">
    <div class="scr">${body}</div>
    ${nav}
  </div>`;
}
