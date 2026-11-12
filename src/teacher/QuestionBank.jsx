import { useState } from "react";
import { h } from "../shared/html.js";
import { S } from "../shared/data.js";
import { 
  Plus, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Edit3, 
  FileText, 
  Filter, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from "../shared/icons.js";

export function QBank({ qs, f, setF, setEd, gen, nw, loading }) {
  const [expandedId, setExpandedId] = useState(null);

  const pendingCount = qs.filter(q => q.status === "Pending").length;
  const approvedCount = qs.filter(q => q.status === "Approved").length;
  const draftCount = qs.filter(q => q.status === "Draft").length;
  const rejectedCount = qs.filter(q => q.status === "Rejected").length;

  const list = qs.filter(q => 
    (q.text || "").toLowerCase().includes((f.q || "").toLowerCase()) &&
    (!f.s || q.strand === f.s || q.strand_code === f.s) &&
    (!f.st || q.status === f.st) &&
    (!f.diff || q.diff === f.diff)
  );

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 18 }}>
    
    <!-- Header with Action Buttons -->
    <div class="row sp" style=${{ flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 style=${{ fontSize: 22, fontWeight: 800 }}>Question Bank & Review Queue</h2>
        <span class="mu">Author, review, and curate DepEd ALS assessment questions</span>
      </div>
      <div class="row" style=${{ gap: 8 }}>
        <button type="button" class="btn p" onClick=${nw}>
          <${Plus} size=${16} />
          <span>New Question</span>
        </button>
        <button type="button" class="btn" disabled=${loading} onClick=${gen}>
          <${Sparkles} size=${16} color="var(--pr)" />
          <span>${loading ? "Generating..." : "Generate with AI"}</span>
        </button>
      </div>
    </div>

    <!-- Status Tabs Switcher -->
    <div class="chips" style=${{ gap: 8, paddingBottom: 2 }}>
      <button 
        type="button" 
        class="pill ${!f.st ? "on" : ""}" 
        onClick=${() => setF({ ...f, st: "" })}
      >
        <span>All Questions</span>
        <span class="side-pill-count">${qs.length}</span>
      </button>

      <button 
        type="button" 
        class="pill ${f.st === "Pending" ? "on" : ""}" 
        onClick=${() => setF({ ...f, st: "Pending" })}
      >
        <${Clock} size=${12} />
        <span>Pending Review</span>
        ${pendingCount > 0 && h`<span class="side-pill-count warn">${pendingCount}</span>`}
      </button>

      <button 
        type="button" 
        class="pill ${f.st === "Approved" ? "on" : ""}" 
        onClick=${() => setF({ ...f, st: "Approved" })}
      >
        <${CheckCircle2} size=${12} />
        <span>Approved</span>
        <span class="side-pill-count">${approvedCount}</span>
      </button>

      <button 
        type="button" 
        class="pill ${f.st === "Draft" ? "on" : ""}" 
        onClick=${() => setF({ ...f, st: "Draft" })}
      >
        <${FileText} size=${12} />
        <span>Drafts</span>
        <span class="side-pill-count">${draftCount}</span>
      </button>

      <button 
        type="button" 
        class="pill ${f.st === "Rejected" ? "on" : ""}" 
        onClick=${() => setF({ ...f, st: "Rejected" })}
      >
        <${XCircle} size=${12} />
        <span>Rejected</span>
        <span class="side-pill-count">${rejectedCount}</span>
      </button>
    </div>

    <!-- Search & Filter Controls -->
    <div class="row" style=${{ flexWrap: "wrap", gap: 10 }}>
      <div class="input-wrap" style=${{ flex: 2, minWidth: 220 }}>
        <span class="in-icon"><${Search} size=${16} /></span>
        <input 
          class="in" 
          placeholder="Search question stem or choices..." 
          value=${f.q} 
          onInput=${e => setF({ ...f, q: e.target.value })}
        />
      </div>

      <select 
        class="in" 
        style=${{ flex: 1, minWidth: 150 }} 
        value=${f.s} 
        onChange=${e => setF({ ...f, s: e.target.value })}
      >
        <option value="">All Learning Strands</option>
        ${S.map(s => h`<option value=${s.code}>${s.code} – ${s.name.split("–")[1] || s.name}</option>`)}
      </select>

      <select 
        class="in" 
        style=${{ flex: 1, minWidth: 130 }} 
        value=${f.diff || ""} 
        onChange=${e => setF({ ...f, diff: e.target.value })}
      >
        <option value="">All Difficulties</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
    </div>

    <!-- Questions List Table with Expandable Details -->
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th>Question Prompt</th>
            <th>Strand</th>
            <th>Difficulty</th>
            <th>Source</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${list.length === 0 ? h`
            <tr>
              <td colspan="6" class="mu" style=${{ textAlign: "center", padding: 32 }}>
                No questions found matching your filter criteria.
              </td>
            </tr>
          ` : list.map(q => {
            const isApproved = q.status === "Approved";
            const isRejected = q.status === "Rejected";
            const isPending = q.status === "Pending";
            const isExpanded = expandedId === q.id;

            return h`<>
              <tr style=${{ cursor: "pointer" }} onClick=${() => toggleExpand(q.id)}>
                <td style=${{ maxWidth: 380, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>
                  <div class="row" style=${{ gap: 8 }}>
                    <span style=${{ color: "var(--mu)" }}>
                      ${isExpanded ? h`<${ChevronUp} size=${14} />` : h`<${ChevronDown} size=${14} />`}
                    </span>
                    <span>${q.text}</span>
                  </div>
                </td>
                <td>
                  <span class="badge" style=${{ fontSize: 11 }}>
                    ${q.strand_code || (q.strand !== undefined ? S[q.strand]?.code : "LS1")}
                  </span>
                </td>
                <td>
                  <span class="badge ${q.diff === "Hard" ? "off" : q.diff === "Easy" ? "on" : ""}" style=${{ fontSize: 11 }}>
                    ${q.diff || "Medium"}
                  </span>
                </td>
                <td>
                  <span class="badge ${q.src === "AI" ? "on" : ""}" style=${{ fontSize: 11 }}>
                    <${q.src === "AI" ? Sparkles : FileText} size=${11} />
                    <span>${q.src || "Manual"}</span>
                  </span>
                </td>
                <td>
                  <span class="badge-status ${isApproved ? "badge-approved" : isRejected ? "badge-rejected" : isPending ? "badge-pending" : "badge-draft"}">
                    <${isApproved ? CheckCircle2 : isRejected ? XCircle : Clock} size=${11} />
                    <span>${q.status}</span>
                  </span>
                </td>
                <td onClick=${e => e.stopPropagation()}>
                  <button 
                    type="button"
                    class="btn ${isPending ? "p" : ""}" 
                    style=${{ padding: "6px 12px", fontSize: 12.5 }}
                    onClick=${() => setEd(q)}
                  >
                    <${Edit3} size=${13} />
                    <span>${isPending ? "Review" : isApproved ? "Edit" : "Inspect"}</span>
                  </button>
                </td>
              </tr>

              <!-- Expanded Preview Drawer -->
              ${isExpanded && h`
                <tr style=${{ background: "var(--sf)" }}>
                  <td colspan="6" style=${{ padding: "16px 20px" }}>
                    <div style=${{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <b style=${{ fontSize: 14 }}>Choices & Correct Answer Key:</b>
                      <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        ${(q.choices || []).map((c, k) => h`
                          <div class="row" style=${{ 
                            padding: "8px 12px", 
                            borderRadius: 8, 
                            background: q.ans === k ? "var(--card)" : "transparent",
                            border: `1px solid ${q.ans === k ? "var(--ok)" : "var(--bd)"}`,
                            fontWeight: q.ans === k ? 700 : 400
                          }}>
                            <span style=${{ color: q.ans === k ? "var(--ok)" : "var(--mu)", marginRight: 6 }}>
                              ${"ABCD"[k]}.
                            </span>
                            <span style=${{ flex: 1 }}>${c}</span>
                            ${q.ans === k && h`<span class="badge on" style=${{ fontSize: 10, padding: "1px 6px" }}>Correct</span>`}
                          </div>
                        `)}
                      </div>

                      ${q.exp && h`
                        <div class="card" style=${{ background: "var(--card)", padding: "10px 14px", marginTop: 4 }}>
                          <span style=${{ fontSize: 12, fontWeight: 700, color: "var(--mu)", display: "block" }}>Educational Explanation:</span>
                          <span style=${{ fontSize: 13 }}>${q.exp}</span>
                        </div>
                      `}

                      ${q.rejection_reason && h`
                        <div class="card" style=${{ background: "var(--bad-bg)", borderColor: "var(--bad)", padding: "10px 14px" }}>
                          <span style=${{ fontSize: 12, fontWeight: 700, color: "var(--bad)", display: "block" }}>Rejection Rationale:</span>
                          <span style=${{ fontSize: 13, color: "var(--bad)" }}>${q.rejection_reason}</span>
                        </div>
                      `}
                    </div>
                  </td>
                </tr>
              `}
            </>`;
          })}
        </tbody>
      </table>
    </div>

    <div class="row sp" style=${{ fontSize: 12, color: "var(--mu)" }}>
      <span>Showing ${list.length} of ${qs.length} total question items</span>
      <span>DepEd ALS Standard: Strict 4-choice Multiple Choice Question (MCQ) format</span>
    </div>

  </div>`;
}
