/**
 * Main workspace layout and tab router for authenticated Teachers and Administrators (`TeacherLayout`).
 * Coordinates sidebar navigation, AI question generation, question authoring/approval submissions,
 * question set publishing, account governance (Admin only), and analytics reports.
 */
import { useState, useRef, useMemo } from "react";
import { h } from "../shared/html.js";
import { fetchApi } from "../shared/supabase.js";
import { Dash } from "./Dashboard.jsx";
import { QBank } from "./QuestionBank.jsx";
import { Editor } from "./QuestionEditor.jsx";
import { Sets } from "./QuestionSets.jsx";
import { Acc } from "./Accounts.jsx";
import { Rep } from "./Reports.jsx";
import { 
  LayoutDashboard, 
  HelpCircle, 
  FolderKanban, 
  Users, 
  BarChart3, 
  ShieldCheck, 
  GraduationCap 
} from "../shared/icons.js";

export function TeacherLayout({ profile, qs, setQs, sets, setSets, acc, setAcc, say, onLogout }) {
  const [pg, setPg] = useState("Dashboard");
  const [ed, setEd] = useState(null);
  const [f, setF] = useState({ q: "", s: "", st: "", diff: "" });
  const [loading, setLoading] = useState(false);
  const strandsCacheRef = useRef(null);
  const topicsCacheRef = useRef(new Map());

  const reloadQuestions = async () => {
    try {
      const res = await fetchApi("/api/admin/questions");
      if (res.questions) setQs(res.questions);
    } catch (e) {}
  };

  const reloadSets = async () => {
    try {
      const res = await fetchApi("/api/question-sets", { auth: false });
      if (res.question_sets) setSets(res.question_sets);
    } catch (e) {}
  };

  const handleAiGenerate = async () => {
    setLoading(true);
    say("Generating questions via Google Gemini...");
    try {
      const res = await fetchApi("/api/ai/generate-questions", {
        method: "POST",
        body: JSON.stringify({
          difficulty: "Medium",
          count: 3
        })
      });
      say(res.message || "AI questions generated in Pending review status!");
      await reloadQuestions();
    } catch (e) {
      say("AI Generation failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditorDone = async (n) => {
    if (!n) {
      setEd(null);
      return;
    }

    try {
      if (!strandsCacheRef.current) {
        const strandsRes = await fetchApi("/api/strands", { auth: false });
        if (strandsRes?.strands) strandsCacheRef.current = strandsRes.strands;
      }
      const strandObj = strandsCacheRef.current?.[n.strand || 0];
      let topicId = n.topic_id || null;
      if (strandObj && (n.isNew || strandObj.strand_id !== n.strand_id || !topicId)) {
        let cachedTopic = topicsCacheRef.current.get(strandObj.strand_id);
        if (!cachedTopic) {
          const topicsRes = await fetchApi(`/api/strands/${strandObj.strand_id}/topics`, { auth: false });
          cachedTopic = topicsRes.topics?.[0]?.topic_id || null;
          if (cachedTopic) topicsCacheRef.current.set(strandObj.strand_id, cachedTopic);
        }
        topicId = cachedTopic || topicId;
      }

      if (n.isNew) {
        await fetchApi("/api/admin/questions", {
          method: "POST",
          body: JSON.stringify({
            topic_id: topicId,
            question_text: n.text,
            choices: n.choices,
            correct_index: n.ans,
            explanation: n.exp,
            difficulty: n.diff,
            status: n.status
          })
        });
        say("Created question successfully: " + n.status);
      } else {
        // Update question content and status (Approve / Reject / Draft / Pending)
        await fetchApi(`/api/admin/questions/${n.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            topic_id: topicId || undefined,
            question_text: n.text,
            choices: n.choices,
            correct_index: n.ans,
            explanation: n.exp,
            difficulty: n.diff,
            status: n.status,
            rejection_reason: n.rej || undefined
          })
        });
        say(`Question saved (${n.status})`);
      }
      await reloadQuestions();
    } catch (e) {
      say("Error: " + e.message);
    } finally {
      setEd(null);
    }
  };

  const pendingQuestionsCount = useMemo(() => qs.filter(q => q.status === "Pending").length, [qs]);

  const navItems = [
    { label: "Dashboard", id: "Dashboard", icon: LayoutDashboard },
    { 
      label: "Question Bank", 
      id: "Questions", 
      icon: HelpCircle, 
      count: pendingQuestionsCount > 0 ? pendingQuestionsCount : null,
      isWarn: pendingQuestionsCount > 0
    },
    { label: "Question Sets", id: "Question Sets", icon: FolderKanban, count: sets.length || null }
  ];
  if (profile?.role === "Admin") {
    navItems.push({ label: "Accounts", id: "Accounts", icon: Users, count: acc.length || null });
  }
  navItems.push({ label: "Reports", id: "Reports", icon: BarChart3 });

  return h`<div class="adm">
    <!-- Sidebar Navigation -->
    <aside class="side">
      <div class="side-brand">
        <div class="row" style=${{ gap: 10 }}>
          <div class="avatar" style=${{ 
            width: 40, 
            height: 40, 
            background: "var(--sf)", 
            color: "var(--pr)", 
            fontSize: 15, 
            fontWeight: 800,
            borderRadius: 12
          }}>
            ${(profile?.display_name || "E").charAt(0).toUpperCase()}
          </div>
          <div style=${{ minWidth: 0, flex: 1 }}>
            <b style=${{ 
              fontSize: 14, 
              display: "block", 
              whiteSpace: "nowrap", 
              overflow: "hidden", 
              textOverflow: "ellipsis" 
            }}>
              ${profile?.display_name || "Educator"}
            </b>
            <span class="badge ${profile?.role === "Admin" ? "on" : ""}" style=${{ 
              marginTop: 2, 
              fontSize: 10.5, 
              padding: "1px 7px" 
            }}>
              <${profile?.role === "Admin" ? ShieldCheck : GraduationCap} size=${11} />
              <span>${profile?.role}</span>
            </span>
          </div>
        </div>
      </div>

      <nav class="side-nav">
        ${navItems.map(item => {
          const IconComponent = item.icon;
          const isActive = pg === item.id;
          return h`<button 
            type="button"
            class=${isActive ? "on" : ""} 
            onClick=${() => { setPg(item.id); setEd(null); }}
          >
            <div class="row" style=${{ gap: 10 }}>
              <${IconComponent} size=${18} />
              <span>${item.label}</span>
            </div>
            ${item.count !== null && item.count !== undefined && h`
              <span class="side-pill-count ${item.isWarn ? "warn" : ""}">
                ${item.count}
              </span>
            `}
          </button>`;
        })}
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="main">
      ${pg === "Dashboard" && h`<${Dash} 
        qs=${qs} 
        acc=${acc} 
        sets=${sets} 
        setPg=${setPg}
        setEd=${setEd}
        gen=${handleAiGenerate}
        loading=${loading}
      />`}

      ${pg === "Questions" && (ed ? h`
        <${Editor} 
          q=${ed} 
          isAdmin=${profile?.role === "Admin"}
          done=${handleEditorDone}
        />
      ` : h`
        <${QBank} 
          qs=${qs} 
          f=${f} 
          setF=${setF} 
          setEd=${setEd} 
          isAdmin=${profile?.role === "Admin"}
          loading=${loading}
          gen=${handleAiGenerate} 
          nw=${() => setEd({
            id: null,
            strand: 0,
            text: "",
            choices: ["", "", "", ""],
            ans: 0,
            exp: "",
            diff: "Easy",
            src: "Manual",
            status: "Draft",
            isNew: true
          })}
        />
      `)}

      ${pg === "Question Sets" && h`<${Sets} 
        sets=${sets} 
        setSets=${setSets} 
        qs=${qs} 
        say=${say} 
        reloadSets=${reloadSets}
      />`}

      ${pg === "Accounts" && h`<${Acc} 
        acc=${acc} 
        setAcc=${setAcc}
        say=${say}
      />`}

      ${pg === "Reports" && h`<${Rep} 
        say=${say} 
        sets=${sets}
      />`}
    </main>
  </div>`;
}
