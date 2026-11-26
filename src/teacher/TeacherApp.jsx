/**
 * Root controller for Teacher (`/teacher`) and Administrator (`/admin`) portals.
 * Enforces educator role authorization via Supabase Auth and loads questions, sets, and accounts into `TeacherLayout`.
 */
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
  LogOut, 
  Sun, 
  Moon 
} from "../shared/icons.js";

export default function TeacherApp() {
  const isAdminPath = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const isDark = theme === "dark";
  const [toast, say] = useToast();
  const [qs, setQs] = useState([]);
  const [sets, setSets] = useState([]);
  const [acc, setAcc] = useState([]);

  // Check auth session on mount, auth changes, and browser bfcache pageshow
  useEffect(() => {
    let active = true;

    const verifyStaffSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        if (!session?.user) {
          setProfile(null);
          setAuthChecked(true);
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("profile_id, display_name, role, account_status")
          .eq("profile_id", session.user.id)
          .single();

        if (!active) return;

        if (!prof || prof.account_status === "Suspended") {
          await supabase.auth.signOut();
          if (active) {
            setProfile(null);
            setAuthChecked(true);
          }
          return;
        }

        if (prof.role === "Learner") {
          window.location.replace("/");
          return;
        }

        if (isAdminPath && prof.role !== "Admin") {
          window.location.replace("/teacher");
          return;
        }

        if (prof.role === "Teacher" || prof.role === "Admin") {
          setProfile(prof);
        } else {
          setProfile(null);
        }
        setAuthChecked(true);
      } catch (e) {
        if (active) setAuthChecked(true);
      }
    };

    verifyStaffSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setProfile(null);
        setAuthChecked(true);
      } else {
        verifyStaffSession();
      }
    });

    const onPageShow = () => verifyStaffSession();
    window.addEventListener("pageshow", onPageShow);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [isAdminPath]);

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

  if (!authChecked) {
    return h`<div class="teacher-root" style=${{ alignItems: "center", justifyContent: "center" }}>
      <p class="mu" style=${{ fontSize: 14 }}>Loading…</p>
    </div>`;
  }

  return h`<div class="teacher-root">
    ${profile ? h`
      <header class="teacher-top-bar">
        <div class="teacher-top-inner">
          <div class="teacher-brand">
            <div class="brand-logo-wrap sm">
              <img
                src="/alamin_logo_cutout.png"
                alt="ALAMIN"
                class="brand-logo-img"
                style=${{ height: 34 }}
              />
            </div>
            <div class="teacher-brand-meta">
              <b>${isAdminPath ? "Admin Portal" : "Teacher Portal"}</b>
            </div>
          </div>

          <div class="teacher-top-actions">
            <span class="pill teacher-role-pill" style=${{ background: "var(--sf)", color: "var(--pr)", fontWeight: 700 }}>
              <${profile.role === "Admin" ? ShieldCheck : GraduationCap} size=${13} />
              <span>${profile.role}: ${profile.display_name}</span>
            </span>

            <button
              type="button"
              class="teacher-theme-btn"
              onClick=${toggleTheme}
              title=${isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              <${isDark ? Sun : Moon} size=${15} />
            </button>

            <button 
              type="button"
              class="pill" 
              onClick=${handleLogout}
              style=${{ color: "var(--bad)", borderColor: "rgba(217, 45, 32, 0.25)" }}
            >
              <${LogOut} size=${13} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>
    ` : null}

    ${profile ? h`
      <div class="teacher-shell">
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
      </div>
    ` : h`
      <${TeacherLogin} onLogin=${setProfile} />
    `}

    ${toast && h`<div class="toast">${toast}</div>`}
  </div>`;
}
