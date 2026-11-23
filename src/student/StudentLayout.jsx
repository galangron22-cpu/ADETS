import { useState } from "react";
import { h } from "../shared/html.js";
import { S, TOP, sets_of } from "../shared/data.js";
import { supabase } from "../shared/supabase.js";
import { Login } from "./Login.jsx";
import { Quiz } from "./Quiz.jsx";
import { Score } from "./Score.jsx";
import { Chat } from "./Chat.jsx";
import { Prog } from "./Progress.jsx";
import { ProfileModal } from "./ProfileModal.jsx";
import {
  Home,
  TrendingUp,
  MessageSquare,
  BookOpen,
  FlaskConical,
  Calculator,
  Briefcase,
  Globe,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  DownloadCloud,
  CheckCircle2,
  Trash2,
  Award,
  Sparkles,
  Layers,
  Search,
  X,
  GraduationCap
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

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [topicTab, setTopicTab] = useState("sets");
  const [showProfile, setShowProfile] = useState(false);

  if (scr === "login" || !user) {
    return h`<${Login} ...${p} />`;
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    p.setUser(null);
    go("login", {});
  };

  // 3 Primary Navigation Items for the Bottom Island (No Sign Out button here)
  const navItems = [
    { label: "Home", id: "home", icon: Home },
    { label: "Progress", id: "progress", icon: TrendingUp },
    { label: "AI Tutor", id: "chat", icon: MessageSquare }
  ];

  // Floating iOS Bottom Navigation Dock (3 clean tabs, perfectly fitted)
  const floatingDock = h`
    <div class="ios-dock-wrapper">
      <nav class="ios-dock">
        ${navItems.map(item => {
          const Icon = item.icon;
          const isActive = scr === item.id;
          return h`
            <button 
              type="button"
              class="ios-dock-btn ${isActive ? "on" : ""}" 
              onClick=${() => go(item.id, {})}
            >
              <${Icon} size=${17} />
              <span>${T(item.label)}</span>
            </button>
          `;
        })}
      </nav>
    </div>
  `;

  // Desktop Top App Bar (Branding on left, Avatar on right, NO duplicate nav tabs, NO online tag)
  const desktopAppBar = h`
    <header class="desktop-app-bar">
      <div class="desktop-app-bar-inner">
        <div class="desktop-brand" onClick=${() => go("home")}>
          <div class="desktop-brand-icon">
            <${GraduationCap} size=${20} />
          </div>
          <div>
            <b style=${{ fontSize: 16, letterSpacing: "normal" }}>ALAMIN</b>
            <span style=${{ fontSize: 11, color: "var(--mu)", display: "block" }}>DepEd ALS Learner Portal</span>
          </div>
        </div>

        <!-- Clean Avatar only (no online tag, clicking opens profile menu) -->
        <div 
          class="ios-avatar-btn" 
          style=${{ width: 40, height: 40, fontSize: 15 }}
          onClick=${() => setShowProfile(true)}
          title="Open Profile & Settings"
        >
          ${(user || "L").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  `;

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

    // Filter strands based on search and pill filter
    const filteredStrands = strands.filter((s, idx) => {
      if (activeFilter !== "all" && activeFilter !== String(idx)) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const code = (s.code || "").toLowerCase();
        const name = (s.name || "").toLowerCase();
        return code.includes(query) || name.includes(query);
      }
      return true;
    });

    body = h`
      <!-- iOS Header: Greeting & Profile Avatar -->
      <div class="ios-header">
        <div>
          <h1 class="ios-greeting-title">Hello, ${user || "Learner"}</h1>
          <p class="ios-greeting-sub">Welcome to Alamin ALS · Division of Valenzuela</p>
        </div>
        <div 
          class="ios-avatar-btn" 
          onClick=${() => setShowProfile(true)} 
          title="Open Profile & Settings"
        >
          ${(user || "L").charAt(0).toUpperCase()}
        </div>
      </div>

      <!-- iOS Pill Search Bar (Full Width, No Cramped Filter Button) -->
      <div class="ios-search-wrap">
        <${Search} size=${18} color="var(--mu)" style=${{ flexShrink: 0 }} />
        <input 
          class="ios-search-input" 
          placeholder="Search learning strands, topics, practice sets..." 
          value=${searchQuery}
          onInput=${e => setSearchQuery(e.target.value)}
        />
        ${searchQuery && h`
          <button 
            type="button" 
            class="ios-round-btn" 
            style=${{ width: 28, height: 28, border: "none", background: "transparent" }}
            onClick=${() => setSearchQuery("")}
            title="Clear"
          >
            <${X} size=${15} />
          </button>
        `}
      </div>

      <!-- Featured Desktop 2-Column Grid (Hero Card + AI Assistant Card - Relocated to Search Bar) -->
      <div class="desktop-hero-grid">
        
        <!-- Hero Featured Card (TripGlide Style) -->
        <div class="ios-hero-card">
          <div class="ios-hero-top">
            <span class="ios-hero-badge">DepEd ALS A&E</span>
            <div class="ios-hero-round-icon">
              <${Award} size=${18} />
            </div>
          </div>

          <div style=${{ margin: "14px 0 18px 0" }}>
            <span style=${{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.85, fontWeight: 700 }}>
              Curriculum Readiness
            </span>
            <h2 class="ios-hero-title">
              ALS A&E Equivalency Exam
            </h2>
            <div class="bar" style=${{ height: 8, marginTop: 12, background: "rgba(255,255,255,0.2)" }}>
              <i style=${{ width: overallProgress + "%", background: "#ffffff" }}></i>
            </div>
          </div>

          <!-- Bottom Floating Frosted Glass Bar -->
          <div class="ios-hero-glass-bar">
            <div>
              <span style=${{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700, display: "block" }}>
                Overall ALS Benchmark
              </span>
              <b style=${{ fontSize: 17, color: "#ffffff", letterSpacing: "normal" }}>
                ${overallProgress}% Mastery
              </b>
              <span style=${{ fontSize: 12, color: "#cbd5e1", display: "block", marginTop: 2 }}>
                Target: 75% · ${completedAttemptsCount} Quizzes Completed
              </span>
            </div>

            <button 
              type="button" 
              class="ios-circle-btn" 
              onClick=${() => go("topics", { strand: 0, strand_id: strands[0]?.strand_id })}
              title="Start Review"
            >
              <${ArrowRight} size=${20} />
            </button>
          </div>
        </div>

        <!-- Alamin AI Study Assistant Card with Chatbot Image -->
        <div class="ios-ai-card" onClick=${() => go("chat", {})}>
          <img 
            src="/chatbot-profile-image.png" 
            alt="Alamin AI Study Assistant" 
            class="ios-ai-avatar" 
          />
          <div style=${{ flex: 1 }}>
            <div class="row sp" style=${{ marginBottom: 4 }}>
              <b style=${{ fontSize: 15, color: "var(--tx)", letterSpacing: "normal" }}>Alamin AI Tutor</b>
              <span class="badge on" style=${{ fontSize: 11, padding: "2px 8px" }}>Online</span>
            </div>
            <p style=${{ margin: 0, fontSize: 12.5, color: "var(--mu)", lineHeight: 1.4 }}>
              ${T("Need help understanding a lesson? Ask any ALS topic.")}
            </p>
            <div class="row" style=${{ marginTop: 10, color: "var(--pr)", fontWeight: 700, fontSize: 13, gap: 4 }}>
              <span>Ask a Question</span>
              <${ChevronRight} size=${14} />
            </div>
          </div>
        </div>

      </div>

      <!-- Category Filter Pills (Horizontal Scrollable) -->
      <div>
        <div class="row sp" style=${{ marginBottom: 8, alignItems: "center" }}>
          <h3 class="ios-section-label">Select Learning Strand</h3>
          ${searchQuery && h`
            <span style=${{ fontSize: 12, color: "var(--pr)", cursor: "pointer", fontWeight: 600 }} onClick=${() => setSearchQuery("")}>
              Clear Search
            </span>
          `}
        </div>

        <div class="ios-pills-scroll">
          <button 
            type="button" 
            class="ios-pill-tab ${activeFilter === "all" ? "active" : ""}" 
            onClick=${() => setActiveFilter("all")}
          >
            All Strands
          </button>
          ${strands.map((s, idx) => h`
            <button 
              type="button" 
              class="ios-pill-tab ${activeFilter === String(idx) ? "active" : ""}" 
              onClick=${() => setActiveFilter(activeFilter === String(idx) ? "all" : String(idx))}
            >
              ${s.code || `LS${idx + 1}`}
            </button>
          `)}
        </div>
      </div>

      <!-- Learning Strands Section Header -->
      <div class="row sp" style=${{ marginTop: 6, alignItems: "center", gap: 10 }}>
        <div style=${{ minWidth: 0, flex: 1 }}>
          <h3 class="ios-section-label">${T("Learning Strands")}</h3>
          <span class="mu" style=${{ fontSize: 12.5, display: "block", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            5 Core Competencies for Elementary & Secondary ALS
          </span>
        </div>
        <span class="badge" style=${{ fontSize: 11.5, whiteSpace: "nowrap", flexShrink: 0, padding: "3px 10px" }}>
          ${filteredStrands.length} Available
        </span>
      </div>

      <!-- Responsive Strands Grid (1 col mobile, 2 col tablet, 3 col desktop) -->
      <div class="strands-responsive-grid">
        ${filteredStrands.map((s, idx) => {
          const originalIndex = strands.findIndex(orig => orig.code === s.code);
          const strandIndex = originalIndex >= 0 ? originalIndex : idx;
          const IconComponent = STRAND_ICONS[strandIndex % STRAND_ICONS.length] || BookOpen;
          const progressVal = pr[strandIndex] || 0;
          const strandSetsCount = sets.filter(x => 
            (s.strand_id && x.strand_id === s.strand_id) || 
            x.strand === s.id ||
            x.strand_id === s.id
          ).length;

          return h`
            <div 
              class="ios-strand-card" 
              onClick=${() => go("topics", { strand: strandIndex, strand_id: s.strand_id })}
            >
              <div class="row sp" style=${{ alignItems: "flex-start" }}>
                <div class="row" style=${{ gap: 12, flex: 1 }}>
                  <div class="strand-icon-box">
                    <${IconComponent} size=${22} />
                  </div>
                  <div style=${{ flex: 1 }}>
                    <span class="badge" style=${{ fontSize: 11, padding: "2px 8px" }}>
                      ${s.code || `LS${strandIndex + 1}`}
                    </span>
                    <b style=${{ fontSize: 14.5, display: "block", marginTop: 4, letterSpacing: "normal" }}>
                      ${T(s.rawName || s.name.replace(/^Strand \d+ – /, ""))}
                    </b>
                  </div>
                </div>
                <div style=${{ textAlign: "right" }}>
                  <span style=${{ fontSize: 13, fontWeight: 700, color: progressVal >= 75 ? "var(--ok)" : "var(--tx)" }}>
                    ${progressVal}%
                  </span>
                </div>
              </div>

              <div class="bar" style=${{ height: 8 }}>
                <i style=${{ 
                  width: progressVal + "%",
                  background: progressVal >= 75 ? "var(--ok)" : "var(--pr)"
                }}></i>
              </div>

              <div class="row sp" style=${{ fontSize: 12, color: "var(--mu)", paddingTop: 4 }}>
                <span>${strandSetsCount} ${strandSetsCount === 1 ? T("Practice Set") : T("Practice Sets")}</span>
                <span style=${{ color: "var(--pr)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span>${T("Start Review")}</span>
                  <${ChevronRight} size=${14} />
                </span>
              </div>
            </div>
          `;
        })}
      </div>
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
      <!-- iOS Detail Header (Back button, Title, Right Action) -->
      <div class="row sp" style=${{ alignItems: "center" }}>
        <button 
          type="button"
          class="ios-round-btn"
          onClick=${() => go("home")}
          title="Back to Strands"
        >
          <${ChevronLeft} size=${20} />
        </button>

        <div style=${{ textAlign: "center" }}>
          <span class="badge" style=${{ fontSize: 11.5, padding: "2px 8px" }}>${st.code}</span>
          <b style=${{ fontSize: 16, display: "block", marginTop: 2, letterSpacing: "normal" }}>${T(st.name.replace(/^Strand \d+ – /, ""))}</b>
        </div>

        <button 
          type="button" 
          class="ios-round-btn" 
          onClick=${() => go("chat", { ask: `Can you give me a summary of ${st.name}?` })}
          title="Ask AI about this Strand"
        >
          <${Sparkles} size=${17} color="var(--pr)" />
        </button>
      </div>

      <!-- Segmented Pill Switcher (Practice Sets vs Competencies) -->
      <div class="ios-segmented">
        <button 
          type="button" 
          class="ios-segmented-btn ${topicTab === "sets" ? "active" : ""}"
          onClick=${() => setTopicTab("sets")}
        >
          Practice Sets (${strandSets.length})
        </button>
        <button 
          type="button" 
          class="ios-segmented-btn ${topicTab === "topics" ? "active" : ""}"
          onClick=${() => setTopicTab("topics")}
        >
          Competencies (${topicList.length})
        </button>
      </div>

      ${topicTab === "topics" ? h`
        <div class="card" style=${{ padding: "20px 22px", borderRadius: 22 }}>
          <b style=${{ fontSize: 14, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--mu)" }}>
            DepEd ALS Prescribed Topics
          </b>
          <div class="chips" style=${{ gap: 10 }}>
            ${topicList.map(t => h`
              <span class="chip" style=${{ padding: "8px 16px", fontSize: 13, borderRadius: 9999 }}>
                ${T(t)}
              </span>
            `)}
          </div>
        </div>
      ` : h`
        <div class="strands-responsive-grid">
          ${strandSets.length === 0 ? h`
            <div class="card mu" style=${{ textAlign: "center", padding: "40px 20px", gridColumn: "1 / -1", borderRadius: 22 }}>
              <${Layers} size=${36} style=${{ margin: "0 auto 10px auto", opacity: 0.5 }} />
              <b style=${{ fontSize: 16 }}>${T("No question sets available yet")}</b>
              <p style=${{ margin: "6px 0 0 0", fontSize: 13.5 }}>
                ${T("New practice sets will appear here once published by your ALS Teacher.")}
              </p>
            </div>
          ` : strandSets.map(s => {
            const isSaved = saved.includes(s.id);
            const questionCount = s.question_count || 10;

            return h`
              <div class="card" style=${{ display: "flex", flexDirection: "column", gap: 12, borderRadius: 22, padding: "20px" }}>
                <div class="row sp">
                  <div>
                    <b style=${{ fontSize: 16, display: "block", letterSpacing: "normal" }}>${s.title}</b>
                    <span class="mu" style=${{ fontSize: 12.5 }}>
                      ${T("Version")} ${s.ver || 1} · ${questionCount} ${T("Questions")}
                    </span>
                  </div>
                  ${isSaved ? h`
                    <span class="badge on" style=${{ fontSize: 11.5 }}>
                      <${CheckCircle2} size=${12} />
                      <span>${T("Offline Ready")}</span>
                    </span>
                  ` : h`
                    <span class="badge" style=${{ fontSize: 11.5 }}>${T("Online Only")}</span>
                  `}
                </div>

                <div class="row" style=${{ gap: 10, marginTop: 4 }}>
                  ${isSaved ? h`
                    <button 
                      type="button"
                      class="btn d" 
                      style=${{ flex: 1, borderRadius: 9999, padding: "10px" }} 
                      onClick=${() => p.removeSet ? p.removeSet(s.id) : p.setSaved(saved.filter(x => x !== s.id))}
                    >
                      <${Trash2} size=${15} />
                      <span>${T("Remove")}</span>
                    </button>
                  ` : h`
                    <button 
                      type="button"
                      class="btn" 
                      style=${{ flex: 1, borderRadius: 9999, padding: "10px" }} 
                      disabled=${!online} 
                      onClick=${() => p.downloadSet ? p.downloadSet(s.id) : (p.setSaved([...saved, s.id]), p.say("Downloaded for offline"))}
                    >
                      <${DownloadCloud} size=${15} />
                      <span>${T("Download for Offline")}</span>
                    </button>
                  `}
                  <button 
                    type="button"
                    class="btn p" 
                    style=${{ flex: 1.2, borderRadius: 9999, padding: "10px 16px" }} 
                    disabled=${!isSaved && !online} 
                    onClick=${() => go("quiz", { set: s.id, strand_id: st.strand_id })}
                  >
                    <span>${T("Start Quiz")}</span>
                    <${ArrowRight} size=${15} />
                  </button>
                </div>
              </div>
            `;
          })}
        </div>
      `}

      <!-- Bottom Floating CTA Button -->
      ${strandSets.length > 0 && h`
        <div class="ios-bottom-cta-wrap">
          <button 
            type="button" 
            class="ios-bottom-cta-btn" 
            onClick=${() => go("quiz", { set: strandSets[0].id, strand_id: st.strand_id })}
          >
            <span>Start Practice Assessment</span>
            <${ArrowRight} size=${18} />
          </button>
        </div>
      `}
    `;
  } else if (scr === "quiz") {
    body = h`<${Quiz} ...${p} key=${p.ctx.set + "-" + (p.ctx.n || 0)}/>`;
  } else if (scr === "score") {
    body = h`<${Score} ...${p}/>`;
  } else if (scr === "chat") {
    body = h`<${Chat} ...${p}/>`;
  } else if (scr === "progress") {
    body = h`<${Prog} ...${p}/>`;
  }

  return h`
    <div class="app-shell">
      ${desktopAppBar}
      <main class="ios-content">
        ${body}
      </main>
      ${floatingDock}

      <!-- Working Profile & Settings Modal -->
      ${showProfile && h`
        <${ProfileModal} 
          user=${user}
          setUser=${p.setUser}
          lang=${p.lang}
          setLang=${p.setLang}
          T=${T}
          onClose=${() => setShowProfile(false)}
          onLogout=${handleLogout}
          saved=${saved}
          att=${att}
          say=${p.say}
        />
      `}
    </div>
  `;
}
