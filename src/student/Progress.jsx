/**
 * Learner mastery & assessment history dashboard.
 * Computes per-strand averages against the 75% ALS passing benchmark and manually syncs queued offline attempts.
 */
import { useState, useMemo } from "react";
import { h } from "../shared/html.js";
import { S } from "../shared/data.js";
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Award, 
  BookOpen, 
  FlaskConical, 
  Calculator, 
  Briefcase, 
  Globe, 
  ChevronRight, 
  AlertCircle, 
  Wifi, 
  WifiOff 
} from "../shared/icons.js";

// Distinctive icons for each of the 5 ALS Learning Strands
const STRAND_ICONS = [
  BookOpen,       // LS1: Communication Skills
  FlaskConical,   // LS2: Scientific Literacy
  Calculator,     // LS3: Mathematical Skills
  Briefcase,      // LS4: Life & Career Skills
  Globe           // LS5: Understanding Self & Society
];

export function Prog(p) {
  const [localSyncing, setLocalSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  const strands = p.strands || S;

  const setsById = useMemo(() => {
    const map = new Map();
    for (const b of p.offlineBundles || []) map.set(b.id, b);
    for (const s of p.sets || []) map.set(s.id, s);
    return map;
  }, [p.sets, p.offlineBundles]);

  // Calculate local & synced strand statistics from p.att
  const strandStats = useMemo(() => {
    return strands.map((s, idx) => {
      const attempts = p.att.filter(x => {
        if (x.strand_id && s.strand_id) {
          return x.strand_id === s.strand_id;
        }
        const setObj = setsById.get(x.set ?? x.question_set_id ?? x.set_id);
        const setStrand = setObj ? (setObj.strand_id ?? setObj.strand) : null;
        if (setStrand !== null && setStrand !== undefined) {
          return setStrand === s.strand_id || setStrand === s.id;
        }
        return false;
      });

      const avg = attempts.length
        ? Math.round(attempts.reduce((t, x) => t + (x.score / (x.total || 1)), 0) / attempts.length * 100)
        : 0;

      return {
        ...s,
        idx,
        attemptsCount: attempts.length,
        avg,
        isMastered: avg >= 75
      };
    });
  }, [strands, p.att, setsById]);

  const pendingAttempts = useMemo(() => p.att.filter(x => !x.sync), [p.att]);
  const pend = pendingAttempts.length;

  const { overallMastery, masteredCount } = useMemo(() => {
    const attemptedStrands = strandStats.filter(s => s.attemptsCount > 0);
    const overall = attemptedStrands.length
      ? Math.round(attemptedStrands.reduce((sum, s) => sum + s.avg, 0) / attemptedStrands.length)
      : 0;
    const mastered = strandStats.filter(s => s.attemptsCount > 0 && s.isMastered).length;
    return { overallMastery: overall, masteredCount: mastered };
  }, [strandStats]);

  const isSyncing = Boolean(p.syncing || localSyncing);
  const activeMsg = msg || p.syncError || "";

  const handleSync = async () => {
    setMsg("");
    p.clearSyncError?.();

    if (pend === 0) {
      p.say("All quiz attempts are already synced to the cloud.");
      return;
    }

    setLocalSyncing(true);
    try {
      const outcome = await p.syncPending?.({ silent: false });
      if (!outcome) {
        setMsg("Sync handler unavailable. Please refresh and try again.");
        return;
      }
      if (outcome.status === "empty") {
        p.say("All quiz attempts are already synced to the cloud.");
      } else if (outcome.message) {
        setMsg(outcome.message);
      }
    } finally {
      setLocalSyncing(false);
    }
  };

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 16 }}>
    
    <!-- Top Header with Connection Status & Sync Action -->
    <div class="row sp" style=${{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
      <div style=${{ minWidth: 0, flex: "1 1 180px" }}>
        <h2 style=${{ fontSize: 20 }}>${p.T("My Progress")}</h2>
        <span class="mu">Curriculum Mastery & Assessment History</span>
      </div>
      <div class="row" style=${{ gap: 8, flexShrink: 0 }}>
        <span class="badge ${p.online ? "on" : "off"}" style=${{ fontSize: 11.5, padding: "4px 9px" }}>
          <${p.online ? Wifi : WifiOff} size=${12} />
          <span>${p.online ? p.T("Online") : p.T("Offline")}</span>
        </span>
        <button 
          type="button"
          class="btn ${pend > 0 ? "p" : ""}" 
          style=${{ padding: "8px 14px", fontSize: 13, gap: 6 }}
          disabled=${isSyncing} 
          onClick=${handleSync}
          title="Sync offline quiz attempts to Supabase cloud"
        >
          <${RefreshCw} size=${14} className=${isSyncing ? "spin" : ""} />
          <span>${isSyncing ? "Syncing..." : pend > 0 ? `Sync (${pend})` : p.T("Sync")}</span>
        </button>
      </div>
    </div>

    <!-- Alert Message Banner -->
    ${activeMsg && h`
      <div class="alert-banner err">
        <${AlertCircle} size=${16} style=${{ flexShrink: 0, marginTop: 2 }} />
        <span>${activeMsg}</span>
      </div>
    `}

    <!-- Overall Mastery Hero Card -->
    <div class="prog-hero">
      <div class="row sp">
        <div style=${{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style=${{ 
            width: 32, 
            height: 32, 
            borderRadius: 10, 
            background: "var(--sf)", 
            color: "var(--pr)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}>
            <${Award} size=${17} />
          </div>
          <div>
            <span style=${{ fontSize: 13, fontWeight: 700, color: "var(--tx)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              ${p.T("Overall ALS Benchmark")}
            </span>
            <span class="mu" style=${{ display: "block", fontSize: 11.5 }}>${p.T("Passing standard: 75% score")}</span>
          </div>
        </div>

        <div style=${{ textAlign: "right" }}>
          <span style=${{ fontSize: 24, fontWeight: 900, color: overallMastery >= 75 ? "var(--ok)" : "var(--pr)", letterSpacing: "-0.03em" }}>
            ${overallMastery}%
          </span>
        </div>
      </div>

      <div class="bar" style=${{ height: 10 }}>
        <i style=${{ 
          width: overallMastery + "%",
          background: overallMastery >= 75 ? "var(--ok)" : "var(--pr)"
        }}></i>
      </div>

      <div class="row sp" style=${{ paddingTop: 8, borderTop: "1px solid var(--bd)", fontSize: 12.5 }}>
        <div style=${{ display: "flex", alignItems: "center", gap: 6 }}>
          <${CheckCircle2} size=${14} color="var(--ok)" />
          <span style=${{ fontWeight: 600 }}>${p.att.length} ${p.T("Completed Quizzes")}</span>
        </div>
        <div style=${{ display: "flex", alignItems: "center", gap: 6 }}>
          <${Award} size=${14} color="var(--pr)" />
          <span style=${{ fontWeight: 600 }}>${masteredCount} ${p.T("of 5 Strands Passed")}</span>
        </div>
      </div>
    </div>

    <!-- Per-Strand Mastery Section -->
    <div style=${{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div class="row sp">
        <h3 style=${{ fontSize: 16, textTransform: "uppercase", letterSpacing: "0.03em" }}>
          ${p.T("Learning Strands Mastery")}
        </h3>
        <span class="badge on" style=${{ fontSize: 11.5 }}>${p.T("DepEd Target: 75%")}</span>
      </div>

      <div class="strands-responsive-grid">
        ${strandStats.map((s, idx) => {
          const IconComponent = STRAND_ICONS[idx % STRAND_ICONS.length] || BookOpen;
          const hasAttempts = s.attemptsCount > 0;
          const isPassing = hasAttempts && s.avg >= 75;

          return h`
            <div 
              class="prog-strand-card"
              style=${{ cursor: "pointer" }}
              onClick=${() => p.go("topics", { strand: idx, strand_id: s.strand_id })}
            >
              <!-- Header: Icon, Code & Title, Percentage Badge -->
              <div class="row sp" style=${{ alignItems: "flex-start", gap: 10 }}>
                <div class="row" style=${{ gap: 10, flex: 1, minWidth: 0 }}>
                  <div class="strand-icon-box" style=${{ 
                    width: 38, 
                    height: 38, 
                    background: isPassing ? "var(--ok-bg)" : "var(--sf)",
                    color: isPassing ? "var(--ok)" : "var(--pr)"
                  }}>
                    <${IconComponent} size=${19} />
                  </div>
                  <div style=${{ flex: 1, minWidth: 0 }}>
                    <div class="row" style=${{ gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                      <span class="badge" style=${{ fontSize: 11, padding: "1px 7px" }}>
                        ${s.code || `LS${idx + 1}`}
                      </span>
                      <b style=${{ fontSize: 13.5, wordBreak: "break-word" }}>
                        ${p.T(s.rawName || s.name.replace(/^Strand \d+ – /, ""))}
                      </b>
                    </div>
                    <span class="mu" style=${{ fontSize: 11.5 }}>
                      ${hasAttempts ? `${s.attemptsCount} ${s.attemptsCount === 1 ? "attempt recorded" : "attempts recorded"}` : p.T("No attempts recorded yet")}
                    </span>
                  </div>
                </div>

                <!-- Score Badge -->
                <span class="badge ${isPassing ? "on" : ""}" style=${{ 
                  fontSize: 12.5, 
                  fontWeight: 700, 
                  padding: "3px 9px",
                  color: isPassing ? "var(--ok)" : hasAttempts ? "var(--pr)" : "var(--mu)"
                }}>
                  ${hasAttempts ? `${s.avg}%` : "0%"}
                </span>
              </div>

              <!-- Horizontal Progress Bar -->
              <div class="bar" style=${{ height: 8 }}>
                <i style=${{ 
                  width: Math.max(hasAttempts ? s.avg : 0, 0) + "%",
                  background: isPassing ? "var(--ok)" : "var(--pr)"
                }}></i>
              </div>

              <!-- Footer: Status Pill & Practice Link -->
              <div class="row sp" style=${{ fontSize: 11.5 }}>
                <span style=${{ 
                  fontWeight: 600, 
                  color: isPassing ? "var(--ok)" : hasAttempts ? "var(--bad)" : "var(--mu)" 
                }}>
                  ${isPassing ? p.T("Mastery Target Met") : hasAttempts ? p.T("Below 75% Target") : p.T("Review Recommended")}
                </span>
                <span style=${{ color: "var(--pr)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 2 }}>
                  <span>${p.T("Practice")}</span>
                  <${ChevronRight} size=${13} />
                </span>
              </div>
            </div>
          `;
        })}
      </div>
    </div>

    <!-- Assessment History Section -->
    <div style=${{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
      <div class="row sp">
        <h3 style=${{ fontSize: 15, textTransform: "uppercase", letterSpacing: "0.03em" }}>
          ${p.T("Assessment History")}
        </h3>
        <span class="mu">${p.att.length} ${p.T("Completed")}</span>
      </div>

      ${p.att.length === 0 ? h`
        <div class="card mu" style=${{ textAlign: "center", padding: 24 }}>
          <p style=${{ margin: "0 0 8px 0", fontSize: 13.5 }}>${p.T("No quiz assessments taken yet.")}</p>
          <button 
            type="button" 
            class="btn p" 
            style=${{ fontSize: 12.5, padding: "8px 14px" }}
            onClick=${() => p.go("home")}
          >
            ${p.T("Start Your First Practice Test")}
          </button>
        </div>
      ` : h`
        <div style=${{ display: "flex", flexDirection: "column", gap: 8 }}>
          ${p.att.map(x => {
            const setId = x.set ?? x.question_set_id ?? x.set_id;
            const setObj = (p.sets || []).find(s => s.id === setId) || (p.offlineBundles || []).find(b => b.id === setId);
            const title = x.set_title || setObj?.title || "Practice Assessment";
            const pct = Math.round((x.score / (x.total || 1)) * 100);
            const isPassing = pct >= 75;

            return h`
              <div class="attempt-row">
                <div style=${{ flex: "1 1 150px", minWidth: 0 }}>
                  <b style=${{ 
                    fontSize: 13.5, 
                    display: "block", 
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis" 
                  }}>
                    ${title}
                  </b>
                  <span class="mu" style=${{ fontSize: 11.5 }}>
                    ${x.date || (x.completed_at ? new Date(x.completed_at).toLocaleDateString() : "Recent")}
                  </span>
                </div>

                <div class="row" style=${{ gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                  <span class="badge ${isPassing ? "on" : "off"}" style=${{ fontSize: 12, fontWeight: 700 }}>
                    ${x.score}/${x.total} (${pct}%)
                  </span>
                  
                  <span class="badge ${x.sync ? "on" : "off"}" style=${{ fontSize: 11, padding: "2px 7px" }}>
                    <${x.sync ? CheckCircle2 : Clock} size=${11} />
                    <span>${x.sync ? p.T("Synced") : p.T("Queued")}</span>
                  </span>
                </div>
              </div>
            `;
          })}
        </div>
      `}
    </div>

    <!-- Pending Queue Notice Banner -->
    ${pend > 0 && h`
      <div class="card" style=${{ 
        background: "var(--sf)", 
        border: "1px solid var(--bd)", 
        display: "flex", 
        alignItems: "center", 
        gap: 12,
        padding: "12px 16px" 
      }}>
        <${Clock} size=${20} color="var(--pr)" style=${{ flexShrink: 0 }} />
        <div style=${{ flex: 1, minWidth: 0 }}>
          <b style=${{ fontSize: 13, display: "block" }}>Offline Assessments Saved Locally</b>
          <span class="mu" style=${{ fontSize: 12, display: "block", lineHeight: 1.4 }}>
            ${pend} assessment${pend > 1 ? "s" : ""} saved locally. ${p.online ? "Tap Sync above to upload now." : "Will upload automatically when internet reconnects."}
          </span>
        </div>
      </div>
    `}

  </div>`;
}
