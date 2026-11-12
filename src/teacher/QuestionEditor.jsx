import { useState } from "react";
import { h } from "../shared/html.js";
import { S } from "../shared/data.js";
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ArrowLeft, 
  AlertCircle 
} from "../shared/icons.js";

export function Editor({ q, done }) {
  const [d, setD] = useState(q);
  const [rr, setRr] = useState(q.rejection_reason || q.rej || "");
  const [err, setErr] = useState("");

  const set = (k, v) => setD({ ...d, [k]: v });

  const handleReject = () => {
    // TC-ADM-04: Rejection without reason is blocked
    if (!rr.trim()) {
      setErr("Rejection reason is required to reject this question.");
      return;
    }
    done({ ...d, status: "Rejected", rej: rr.trim() });
  };

  const handleApprove = () => {
    if (!d.text || d.choices.some(c => !c.trim())) {
      setErr("Question text and all 4 choices are required.");
      return;
    }
    done({ ...d, status: "Approved" });
  };

  const handleSaveDraft = () => {
    if (!d.text) {
      setErr("Question text is required.");
      return;
    }
    done({ ...d, status: "Draft" });
  };

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 16 }}>
    <!-- Header -->
    <div class="row sp">
      <div>
        <h2 style=${{ fontSize: 20 }}>${d.isNew ? "Create New Assessment Item" : "Question Editor & Review Queue"}</h2>
        <span class="mu">Assign strand, calibrate answer choices, and verify educational rationale</span>
      </div>
      <button type="button" class="btn" onClick=${() => done(null)}>
        <${ArrowLeft} size=${15} />
        <span>Back to Question Bank</span>
      </button>
    </div>

    <!-- Error Alert -->
    ${err && h`
      <div class="badge off" style=${{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <${AlertCircle} size=${16} />
        <span>${err}</span>
      </div>
    `}

    <!-- Strand Selection -->
    <div>
      <label class="mu" style=${{ fontWeight: 600, display: "block", marginBottom: 6 }}>ALS Learning Strand</label>
      <select class="in" value=${d.strand || 0} onChange=${e => set("strand", +e.target.value)}>
        ${S.map(s => h`<option value=${s.id}>${s.name}</option>`)}
      </select>
    </div>

    <!-- Question Prompt -->
    <div>
      <label class="mu" style=${{ fontWeight: 600, display: "block", marginBottom: 6 }}>Question Text</label>
      <textarea 
        class="in" 
        rows="3" 
        placeholder="Enter the question stem or problem statement clearly..." 
        value=${d.text} 
        onInput=${e => { set("text", e.target.value); setErr(""); }}
      ></textarea>
    </div>

    <!-- 4 Multiple Choice Options with Radio Buttons -->
    <div style=${{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label class="mu" style=${{ fontWeight: 600 }}>Multiple Choice Options (Select radio button for the correct key)</label>
      ${d.choices.map((c, k) => h`
        <div class="row" style=${{ gap: 10, alignItems: "center" }}>
          <label 
            style=${{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              cursor: "pointer", 
              padding: "8px 12px", 
              border: `1.5px solid ${d.ans === k ? "var(--pr)" : "var(--bd)"}`,
              borderRadius: "var(--radius)",
              background: d.ans === k ? "var(--sf)" : "var(--card)"
            }}
          >
            <input 
              type="radio" 
              name="correct_ans_choice" 
              checked=${d.ans === k} 
              onChange=${() => set("ans", k)} 
              style=${{ width: 16, height: 16, accentColor: "var(--pr)", cursor: "pointer", margin: 0 }}
            />
            <b style=${{ color: d.ans === k ? "var(--pr)" : "inherit" }}>${"ABCD"[k]}</b>
          </label>
          <input 
            class="in g" 
            placeholder=${`Option ${"ABCD"[k]} text`} 
            value=${c} 
            onInput=${e => set("choices", d.choices.map((x, j) => j === k ? e.target.value : x))}
          />
        </div>
      `)}
    </div>

    <!-- Explanation -->
    <div>
      <label class="mu" style=${{ fontWeight: 600, display: "block", marginBottom: 6 }}>Educational Explanation (shown to learners during review)</label>
      <input 
        class="in" 
        placeholder="Provide rationale or reference for the correct answer..." 
        value=${d.exp} 
        onInput=${e => set("exp", e.target.value)}
      />
    </div>

    <!-- Difficulty & Rejection Reason -->
    <div class="row" style=${{ gap: 12, flexWrap: "wrap" }}>
      <div style=${{ flex: 1, minWidth: 160 }}>
        <label class="mu" style=${{ fontWeight: 600, display: "block", marginBottom: 6 }}>Difficulty Level</label>
        <select class="in" value=${d.diff} onChange=${e => set("diff", e.target.value)}>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div style=${{ flex: 2, minWidth: 240 }}>
        <label class="mu" style=${{ fontWeight: 600, display: "block", marginBottom: 6 }}>Rejection Reason (required only if rejecting)</label>
        <input 
          class="in" 
          placeholder="E.g., Ambiguous choices, outside ALS scope..." 
          value=${rr} 
          onInput=${e => { setRr(e.target.value); setErr(""); }}
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="row" style=${{ gap: 10, marginTop: 8 }}>
      <button type="button" class="btn d" style=${{ flex: 1 }} onClick=${handleReject}>
        <${XCircle} size=${15} />
        <span>Reject Question</span>
      </button>
      <button type="button" class="btn" style=${{ flex: 1 }} onClick=${handleSaveDraft}>
        <${FileText} size=${15} />
        <span>Save as Draft</span>
      </button>
      <button type="button" class="btn p" style=${{ flex: 1 }} onClick=${handleApprove}>
        <${CheckCircle2} size=${15} />
        <span>Approve Question</span>
      </button>
    </div>

  </div>`;
}
