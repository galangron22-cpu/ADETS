import { useState, useEffect } from "react";
import { h } from "../shared/html.js";
import { S, sets_of } from "../shared/data.js";
import { fetchApi } from "../shared/supabase.js";
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Award, 
  TrendingUp, 
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
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const [serverStats, setServerStats] = useState(null);

  const strands = p.strands || S;

  // Calculate local strand statistics from p.att
  const strandStats = strands.map((s, idx) => {
    const attempts = p.att.filter(x => {
      if (x.strand_id && s.strand_id) {
        return x.strand_id === s.strand_id;
      }
      const setStrand = sets_of(p, x.set || x.question_set_id || x.set_id);
      if (setStrand) {
        return setStrand === s.strand_id || setStrand === s.id;
      }
      return false;
    });

    const avg = attempts.length 
      ? Math.round(attempts.reduce((t, x) => t + (x.score / x.total), 0) / attempts.length * 100) 
      : 0;

    return {
      ...s,
      idx,
      attemptsCount: attempts.length,
      avg,
      isMastered: avg >= 75
    };
  });

  const pendingAttempts = p.att.filter(x => !x.sync);
  const pend = pendingAttempts.length;

  const attemptedStrands = strandStats.filter(s => s.attemptsCount > 0);
  const overallMastery = attemptedStrands.length
    ? Math.round(attemptedStrands.reduce((sum, s) => sum + s.avg, 0) / attemptedStrands.length)
    : 0;

  const masteredCount = strandStats.filter(s => s.attemptsCount > 0 && s.isMastered).length;

  // Load server-calculated progress if online
  useEffect(() => {
    if (p.online) {
      fetchApi("/api/progress")
        .then(res => {
          if (res.strands) setServerStats(res);
        })
        .catch(() => {});
    }
  }, [p.online]);

  const handleSync = async () => {
    setMsg("");

    // TC-SYNC-02: Tap Sync while offline
    if (!p.online) {
      setMsg("Device is offline. Assessments will automatically upload when reconnected.");
      return;
    }

    if (pend === 0) {
      p.say("All quiz attempts are already synced to the cloud.");
      return;
    }

    setSyncing(true);
    try {
      // TC-SYNC-01 & TC-SYNC-03: Upload queued offline attempts to API
      const res = await fetchApi("/api/quiz-attempts/sync", {
        method: "POST",
        body: JSON.stringify({
          attempts: pendingAttempts.map(a => ({
            attempt_id: a.attempt_id,
            question_set_id: a.set || a.question_set_id,
            started_at: a.completed_at || new Date().toISOString(),
            completed_at: a.completed_at || new Date().toISOString(),
            ans: a.ans || {},
            total: a.total
          }))
        })
      });

      if (res.synced_ids && res.synced_ids.length > 0) {
        const syncedSet = new Set(res.synced_ids);
        p.setAtt(p.att.map(x => (syncedSet.has(x.attempt_id) ? { ...x, sync: true } : x)));
        p.say(`Synced ${res.synced_ids.length} assessment(s) to cloud!`);
      }
    } catch (err) {
      // TC-SYNC-05: Session expired (401)
      if (err.message.includes("401") || err.message.toLowerCase().includes("session") || err.message.toLowerCase().includes("auth")) {
        setMsg("Session expired. Please sign in again to sync your progress.");
      } else {
        setMsg("Sync failed: " + err.message);
      }
    } finally {
      setSyncing(false);
    }
  };

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 16 }}>
    
    <!-- Top Header with Sync Action -->
    <div class="row sp" style=${{ alignItems: "center" }}>
      <div>
        <h2 style=${{ fontSize: 20 }}>${p.T("My Progress")}</h2>
        <span class="mu">Curriculum Mastery & Assessment History</span>
      </div>
      <button 
        type="button"
        class="btn ${pend > 0 ? "p" : ""}" 
        style=${{ padding: "8px 14px", fontSize: 13, gap: 6 }}
        disabled=${syncing} 
        onClick=${handleSync}
        title="Sync offline quiz attempts to Supabase cloud"
      >
        <${RefreshCw} size=${14} className=${syncing ? "spin" : ""} />
        <span>${syncing ? "Syncing..." : pend > 0 ? `Sync (${pend})` : p.T("Sync")}</span>
      </button>
    </div>

    <!-- Alert Message Banner -->
    ${msg && h`
      <div class="badge off" style=${{ 
        padding: "10px 14px", 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        fontSize: 13,
        lineHeight: 1.4,
        borderRadius: "var(--radius)"
      }}>
        <${AlertCircle} size=${16} style=${{ flexShrink: 0 }} />
        <span>${msg}</span>
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
              <div class="row sp" style=${{ alignItems: "flex-start" }}>
                <div class="row" style=${{ gap: 10, flex: 1 }}>
                  <div class="strand-icon-box" style=${{ 
                    width: 38, 
                    height: 38, 
                    background: isPassing ? "var(--ok-bg)" : "var(--sf)",
                    color: isPassing ? "var(--ok)" : "var(--pr)"
                  }}>
                    <${IconComponent} size=${19} />
                  </div>
                  <div style=${{ flex: 1 }}>
                    <div class="row" style=${{ gap: 6, marginBottom: 2 }}>
                      <span class="badge" style=${{ fontSize: 11, padding: "1px 7px" }}>
                        ${s.code || `LS${idx + 1}`}
                      </span>
                      <b style=${{ fontSize: 13.5 }}>
                        ${p.T(s.rawName || s.name.replace(/^Strand \d+ – /, ""))}
                      </b>
                    </div>
                    <span class="mu" style=${{ fontSize: 11.5 }}>
                      ${hasAttempts ? `${s.attemptsCount} ${p.T("attempt recorded")}` : p.T("No attempts recorded yet")}
                    </span>
                  </div>
                </div>

                <!-- Score Badge -->
                <span class="badge ${isPassing ? "on" : hasAttempts ? "" : ""}" style=${{ 
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
            const setObj = (p.sets || []).find(s => s.id === x.set || s.id === x.question_set_id);
            const title = setObj?.title || `Question Set #${String(x.set).slice(0, 8)}`;
            const pct = Math.round((x.score / (x.total || 1)) * 100);
            const isPassing = pct >= 75;

            return h`
              <div class="attempt-row">
                <div style=${{ flex: 1, minWidth: 0 }}>
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

                <div class="row" style=${{ gap: 8, flexShrink: 0 }}>
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
        <div style=${{ flex: 1 }}>
          <b style=${{ fontSize: 13, display: "block" }}>Offline Assessments Saved Locally</b>
          <span class="mu" style=${{ fontSize: 12 }}>
            ${pend} assessment${pend > 1 ? "s" : ""} recorded in IndexedDB. Will upload automatically on internet reconnect.
          </span>
        </div>
      </div>
    `}

  </div>`;
}
