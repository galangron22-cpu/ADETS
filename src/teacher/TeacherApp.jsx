// TEACHER / ADMIN PORTAL (route: /teacher & /admin) – desktop web
import { useState, useEffect } from "react";
import { h } from "../shared/html.js";
import { useTheme, useToast } from "../shared/hooks.js";
import { supabase, fetchApi } from "../shared/supabase.js";
import { TeacherLayout } from "./TeacherLayout.jsx";
import { TeacherLogin } from "./TeacherLogin.jsx";
import { 
  ShieldCheck, 
  GraduationCap, 
  Sparkles, 
  LogOut, 
  ArrowLeft, 
  ArrowRight 
} from "../shared/icons.js";
import "./teacher.css";

export default function TeacherApp() {
  const isAdminPath = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  const [profile, setProfile] = useState(null);
  const [, toggleTheme] = useTheme();
  const [toast, say] = useToast();
  const [qs, setQs] = useState([]);
  const [sets, setSets] = useState([]);
  const [acc, setAcc] = useState([]);

  // Check auth session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("profile_id, display_name, role, account_status")
          .eq("profile_id", session.user.id)
          .single();

        if (prof) {
          if (isAdminPath && prof.role !== "Admin") {
            setProfile(null);
          } else if (prof.role === "Teacher" || prof.role === "Admin") {
            setProfile(prof);
          }
        }
      }
    });
  }, []);

  // Fetch admin data once authenticated
  useEffect(() => {
    if (!profile) return;

    // Load questions
    fetchApi("/api/admin/questions")
      .then(res => res.questions && setQs(res.questions))
      .catch(() => {});

    // Load question sets
    fetchApi("/api/question-sets")
      .then(res => res.question_sets && setSets(res.question_sets))
      .catch(() => {});

    // Load accounts if Admin
    if (profile.role === "Admin") {
      fetchApi("/api/admin/accounts")
        .then(res => {
          if (res.accounts) {
            setAcc(res.accounts.map(a => ({
              id: a.profile_id,
              n: a.display_name,
              r: a.role,
              s: a.account_status
            })));
          }
        })
        .catch(() => {});
    }
  }, [profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return h`<div>
    ${profile ? h`
      <header class="top">
        <div class="row" style=${{ gap: 8 }}>
          <div style=${{ 
            width: 28, 
            height: 28, 
            borderRadius: 8, 
            background: "var(--sf)", 
            color: "var(--pr)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}>
            <${isAdminPath ? ShieldCheck : GraduationCap} size=${17} />
          </div>
          <b>${isAdminPath ? "ALAMIN · Admin Portal" : "ALAMIN · Teacher Portal"}</b>
        </div>

        <span class="pill" style=${{ background: "var(--sf)", color: "var(--pr)", fontWeight: 700 }}>
          <${profile.role === "Admin" ? ShieldCheck : GraduationCap} size=${13} />
          <span>${profile.role}: ${profile.display_name}</span>
        </span>

        <button 
          type="button"
          class="pill" 
          onClick=${handleLogout}
          style=${{ color: "var(--bad)" }}
        >
          <${LogOut} size=${13} />
          <span>Log Out</span>
        </button>
      </header>
    ` : null}

    ${profile ? h`
      <${TeacherLayout} 
        profile=${profile}
        qs=${qs} 
        setQs=${setQs} 
        sets=${sets} 
        setSets=${setSets} 
        acc=${acc} 
        setAcc=${setAcc} 
        say=${say}
        onLogout=${handleLogout}
      />
    ` : h`
      <${TeacherLogin} onLogin=${setProfile} />
    `}

    ${toast && h`<div class="toast">${toast}</div>`}
  </div>`;
}
