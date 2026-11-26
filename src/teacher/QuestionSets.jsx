/**
 * Assessment package builder and publisher (`Sets`).
 * Bundles approved questions per ALS strand into draft reviewer sets and lets Admins publish them for learner offline sync.
 */
import { useState } from "react";
import { h } from "../shared/html.js";
import { S } from "../shared/data.js";
import { fetchApi } from "../shared/supabase.js";
import { 
  Plus, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Layers, 
  DownloadCloud, 
  Sparkles, 
  Check 
} from "../shared/icons.js";

export function Sets({ sets, setSets, qs, say, reloadSets }) {
  const [t, setT] = useState("");
  const [st, setSt] = useState(0);
  const [loading, setLoading] = useState(false);

  // Count approved questions for the selected strand
  const selectedStrand = S[st] || S[0];
  const approvedForStrand = qs.filter(q => 
    q.status === "Approved" && 
    (q.strand === st || q.strand === selectedStrand.id || q.strand_code === selectedStrand.code)
  ).length;

  const add = async () => {
    if (!t.trim()) return;
    setLoading(true);
    try {
      // Find strand_id from strands
      const strandsRes = await fetchApi("/api/strands");
      const strandObj = strandsRes.strands?.[st] || strandsRes.strands?.[0];

      // Get approved questions for this strand to link
      const approvedQs = qs.filter(q => 
        q.status === "Approved" && 
        (q.strand === st || q.strand === selectedStrand.id || q.strand_code === selectedStrand.code)
      );

      const res = await fetchApi("/api/admin/question-sets", {
        method: "POST",
        body: JSON.stringify({
          title: t.trim(),
          strand_id: strandObj.strand_id,
          question_ids: approvedQs.slice(0, 10).map(q => q.id)
        })
      });

      say("Created new question set!");
      setT("");
      reloadSets && reloadSets();
    } catch (e) {
      say("Failed to create set: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const publishSet = async (setId) => {
    try {
      await fetchApi(`/api/admin/question-sets/${setId}/publish`, {
        method: "PATCH"
      });
      say("Published – learners will receive it on next sync");
      reloadSets && reloadSets();
    } catch (e) {
      say("Publish failed: " + e.message);
    }
  };

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 18 }}>
    <div>
      <h2 style=${{ fontSize: 22, fontWeight: 800 }}>Question Sets & Assessment Packages</h2>
      <span class="mu">Package approved curriculum items into reviewer sets for learner offline caching</span>
    </div>

    <!-- Create new set form -->
    <div class="card" style=${{ display: "flex", flexDirection: "column", gap: 12 }}>
      <b style=${{ fontSize: 14 }}>Assemble New Reviewer Package</b>
      
      <div class="row" style=${{ flexWrap: "wrap", gap: 10 }}>
        <input 
          class="in" 
          style=${{ flex: 2, minWidth: 260 }}
          placeholder="New package title (e.g., Mathematics Practice Pack v2)..." 
          value=${t} 
          onInput=${e => setT(e.target.value)}
          onKeyDown=${e => e.key === "Enter" && add()}
        />
        <select 
          class="in" 
          style=${{ flex: 1, minWidth: 160 }} 
          value=${st}
          onChange=${e => setSt(+e.target.value)}
        >
          ${S.map(s => h`<option value=${s.id}>${s.code} – ${s.name.split("–")[1] || s.name}</option>`)}
        </select>
        <button 
          type="button"
          class="btn p" 
          disabled=${loading || !t.trim()} 
          onClick=${add}
        >
          <${Plus} size=${16} />
          <span>${loading ? "Assembling..." : "Assemble Package"}</span>
        </button>
      </div>

      <div class="row sp" style=${{ fontSize: 12, color: "var(--mu)" }}>
        <span class="badge ${approvedForStrand > 0 ? "on" : "off"}" style=${{ fontSize: 11.5 }}>
          <${CheckCircle2} size=${12} />
          <span>${approvedForStrand} approved questions available in ${selectedStrand.code}</span>
        </span>
        <span>Packages bundle up to 10 approved questions with complete explanations for IndexedDB caching</span>
      </div>
    </div>

    <!-- Question Sets Table -->
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th>Reviewer Package Title</th>
            <th>Strand</th>
            <th>Version</th>
            <th>Curriculum Status</th>
            <th>Questions</th>
            <th>Release Management</th>
          </tr>
        </thead>
        <tbody>
          ${sets.map(s => {
            const isPublished = s.status === "Published";
            const strandObj = S.find(x => x.strand_id === s.strand_id || x.id === s.strand) || S[0];

            return h`<tr>
              <td style=${{ fontWeight: 600 }}>
                <div class="row" style=${{ gap: 8 }}>
                  <${FolderKanban} size=${16} color="var(--pr)" />
                  <span>${s.title}</span>
                </div>
              </td>
              <td>
                <span class="badge" style=${{ fontSize: 11 }}>
                  ${strandObj.code || "LS1"}
                </span>
              </td>
              <td>Version ${s.ver || 1}</td>
              <td>
                <span class="badge-status ${isPublished ? "badge-approved" : "badge-pending"}">
                  <${isPublished ? CheckCircle2 : Clock} size=${11} />
                  <span>${s.status}</span>
                </span>
              </td>
              <td>${s.question_count || 10} Questions</td>
              <td>
                ${!isPublished ? h`
                  <button 
                    type="button"
                    class="btn p" 
                    style=${{ padding: "6px 14px", fontSize: 12.5 }}
                    onClick=${() => publishSet(s.id)}
                  >
                    <span>Publish for Learners</span>
                  </button>
                ` : h`
                  <span class="badge on" style=${{ fontSize: 11.5, background: "transparent", border: "none" }}>
                    <${CheckCircle2} size=${13} />
                    <span>Live for Offline Sync</span>
                  </span>
                `}
              </td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>

    <span class="mu">
      Publishing updates the reviewer catalog for ALS students. Offline learners receive new packages on their next internet sync.
    </span>
  </div>`;
}
