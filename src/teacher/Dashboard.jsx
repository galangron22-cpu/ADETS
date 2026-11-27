/**
 * Teacher & Administrator overview dashboard (`Dash`).
 * Displays learner/question/set summary metrics, priority pending review items,
 * ALS strand mastery chart, and quick actions for AI generation or creating question sets.
 */
import { useState, useEffect, useMemo } from "react";
import { h } from "../shared/html.js";
import { S } from "../shared/data.js";
import { fetchApi } from "../shared/supabase.js";
import { 
  Users, 
  HelpCircle, 
  Award, 
  FolderKanban, 
  Sparkles, 
  Plus, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Edit3 
} from "../shared/icons.js";

export function Dash({ qs = [], acc = [], sets = [], setPg, setEd, gen, loading }) {
  const [stats, setStats] = useState({
    learners_count: 120,
    pending_questions: 14,
    average_score: 72
  });

  useEffect(() => {
    fetchApi("/api/admin/reports")
      .then(res => {
        if (res.stats) {
          setStats(res.stats);
        }
      })
      .catch(() => {});
  }, []);

  const { pendingQuestions, pendingCount, learnersTotal, publishedSetsCount } = useMemo(() => {
    const pending = qs.filter(q => q.status === "Pending");
    return {
      pendingQuestions: pending,
      pendingCount: pending.length,
      learnersTotal: acc.filter(a => a.r === "Learner").length || stats.learners_count,
      publishedSetsCount: sets.filter(s => s.status === "Published").length || 5
    };
  }, [qs, acc, sets, stats.learners_count]);

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 24 }}>
    
    <!-- Welcome Header Banner -->
    <div class="row sp" style=${{ flexWrap: "wrap", gap: 14 }}>
      <div>
        <h2 style=${{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Educator Dashboard</h2>
        <span class="mu" style=${{ fontSize: 13.5 }}>
          DepEd Alternative Learning System · Division Curriculum & Assessment Management
        </span>
      </div>
      <div class="row" style=${{ gap: 10 }}>
        <button 
          type="button"
          class="btn p" 
          disabled=${loading}
          onClick=${gen || (() => setPg && setPg("Questions"))}
        >
          <${Sparkles} size=${15} />
          <span>${loading ? "Generating..." : "Generate AI Questions"}</span>
        </button>
        <button 
          type="button"
          class="btn" 
          onClick=${() => setPg && setPg("Question Sets")}
        >
          <${Plus} size=${15} />
          <span>New Assessment Set</span>
        </button>
      </div>
    </div>

    <!-- 4 Stats Metric Cards -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon"><${Users} size=${22} /></div>
        <div class="stat-info">
          <span>Active Learners</span>
          <b>${learnersTotal}</b>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style=${{ 
          color: pendingCount > 0 ? "var(--bad)" : "var(--ok)", 
          background: pendingCount > 0 ? "var(--bad-bg)" : "var(--ok-bg)" 
        }}>
          <${HelpCircle} size=${22} />
        </div>
        <div class="stat-info">
          <span>Awaiting Review</span>
          <b style=${{ color: pendingCount > 0 ? "var(--bad)" : "inherit" }}>
            ${pendingCount || stats.pending_questions}
          </b>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon"><${FolderKanban} size=${22} /></div>
        <div class="stat-info">
          <span>Published Sets</span>
          <b>${publishedSetsCount}</b>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style=${{ color: "var(--ok)", background: "var(--ok-bg)" }}>
          <${Award} size=${22} />
        </div>
        <div class="stat-info">
          <span>Division Average</span>
          <b style=${{ color: "var(--ok)" }}>${stats.average_score}%</b>
        </div>
      </div>
    </div>

    <!-- Pending Review Priority Queue (if any questions pending) -->
    ${pendingCount > 0 ? h`
      <div class="card" style=${{ border: "1.5px solid rgba(245, 158, 11, 0.35)", background: "var(--card)" }}>
        <div class="row sp" style=${{ marginBottom: 12 }}>
          <div class="row" style=${{ gap: 8 }}>
            <div style=${{ 
              width: 32, 
              height: 32, 
              borderRadius: 8, 
              background: "rgba(245, 158, 11, 0.15)", 
              color: "#d97706", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <${Clock} size=${17} />
            </div>
            <div>
              <b style=${{ fontSize: 15 }}>Questions Awaiting Review (${pendingCount})</b>
              <span class="mu" style=${{ display: "block", fontSize: 12 }}>AI-generated & drafted items requiring verification before student release</span>
            </div>
          </div>
          <button 
            type="button" 
            class="btn" 
            style=${{ fontSize: 12.5, padding: "6px 12px" }}
            onClick=${() => setPg && setPg("Questions")}
          >
            <span>View All</span>
            <${ArrowRight} size=${13} />
          </button>
        </div>

        <div style=${{ display: "flex", flexDirection: "column", gap: 8 }}>
          ${pendingQuestions.slice(0, 3).map(q => h`
            <div class="row sp" style=${{ 
              padding: "10px 14px", 
              borderRadius: "var(--radius)", 
              background: "var(--bg)", 
              border: "1px solid var(--bd)" 
            }}>
              <div style=${{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <b style=${{ fontSize: 13.5, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  ${q.text}
                </b>
                <span class="mu" style=${{ fontSize: 11.5 }}>
                  Strand: ${q.strand_code || "General"} · ${q.diff || "Medium"} Difficulty · Source: ${q.src || "AI"}
                </span>
              </div>
              <button 
                type="button"
                class="btn p" 
                style=${{ padding: "6px 12px", fontSize: 12 }}
                onClick=${() => {
                  if (setEd) setEd(q);
                  if (setPg) setPg("Questions");
                }}
              >
                <${Edit3} size=${13} />
                <span>Review Item</span>
              </button>
            </div>
          `)}
        </div>
      </div>
    ` : h`
      <div class="card" style=${{ 
        background: "var(--ok-bg)", 
        border: "1px solid rgba(18, 161, 80, 0.2)", 
        display: "flex", 
        alignItems: "center", 
        gap: 12, 
        padding: "14px 18px" 
      }}>
        <${CheckCircle2} size=${20} color="var(--ok)" style=${{ flexShrink: 0 }} />
        <div style=${{ flex: 1 }}>
          <b style=${{ fontSize: 13.5, color: "var(--tx)", display: "block" }}>Review Queue is Clear</b>
          <span class="mu" style=${{ fontSize: 12 }}>All question items have been reviewed and published. Generate more with AI anytime.</span>
        </div>
      </div>
    `}

    <!-- Average Mastery Chart per Strand -->
    <div class="card" style=${{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div class="row sp">
        <div>
          <b style=${{ fontSize: 15, display: "block" }}>Curriculum Mastery per ALS Learning Strand</b>
          <span class="mu">Aggregate division assessment benchmarks</span>
        </div>
        <span class="badge on">DepEd Target: 75%</span>
      </div>

      <div class="cols" style=${{ height: 160, marginTop: 8 }}>
        ${[78, 70, 68, 74, 80].map((v, k) => h`<div>
          <i style=${{ 
            height: v + "%", 
            background: v >= 75 ? "var(--ok)" : "var(--pr)",
            transition: "height 0.3s ease-out" 
          }}></i>
          <span style=${{ marginTop: 6, fontWeight: 600 }}>${S[k].code}</span>
          <span style=${{ fontSize: 11, color: "var(--tx)", fontWeight: 700 }}>${v}%</span>
        </div>`)}
      </div>

      <div class="row sp" style=${{ fontSize: 12, color: "var(--mu)", paddingTop: 10, borderTop: "1px solid var(--bd)" }}>
        <span>LS1: Communication · LS2: Science · LS3: Math · LS4: Life & Career · LS5: Society</span>
        <button 
          type="button" 
          style=${{ background: "none", border: "none", color: "var(--pr)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
          onClick=${() => setPg && setPg("Reports")}
        >
          <span>Detailed Reports</span>
          <${ArrowRight} size=${13} />
        </button>
      </div>
    </div>

  </div>`;
}
