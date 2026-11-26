/**
 * Learner authentication screen supporting Email/Password sign-in, account registration,
 * bilingual language toggle, and navigation to the Teacher/Educator portal.
 */
import { useState } from "react";
import { h } from "../shared/html.js";
import { supabase } from "../shared/supabase.js";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Globe 
} from "../shared/icons.js";

export function Login(p) {
  const [reg, setReg] = useState(false);
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [nm, setNm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErr("");

    // TC-AUTH-03: Empty fields validation
    if (!em.trim()) {
      setErr("Email is required");
      return;
    }
    if (!pw) {
      setErr("Password is required");
      return;
    }

    // TC-AUTH-05: 8-character minimum boundary validation
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }

    if (reg && !nm.trim()) {
      setErr("Display name is required");
      return;
    }

    setLoading(true);
    try {
      if (reg) {
        // TC-AUTH-04 & TC-AUTH-01: Registration with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: em.trim(),
          password: pw,
          options: {
            data: {
              display_name: nm.trim(),
              role: "Learner"
            }
          }
        });

        if (error) {
          if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already in use")) {
            setErr("Email is already registered. Please sign in below.");
          } else if (error.message.toLowerCase().includes("rate limit")) {
            setErr("Authentication rate limit reached. Please wait or use existing credentials.");
          } else {
            setErr(error.message);
          }
          return;
        }

        const displayName = nm.trim();
        p.setUser(displayName);
        p.say("Account created successfully!");
        p.go("home", {});
      } else {
        // TC-AUTH-01 & TC-AUTH-02: Login with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: em.trim(),
          password: pw
        });

        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            setErr("Invalid email or password");
          } else {
            setErr(error.message);
          }
          return;
        }

        const user = data.user;
        let role = user.user_metadata?.role;
        let displayName = user.user_metadata?.display_name || user.email.split("@")[0];

        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name, role, account_status")
            .eq("profile_id", user.id)
            .single();

          if (prof) {
            role = prof.role || role;
            displayName = prof.display_name || displayName;
            if (prof.account_status === "Suspended") {
              setErr("Your account has been suspended. Please contact the administrator.");
              await supabase.auth.signOut();
              return;
            }
          }
        } catch (errProf) {}

        // Teachers & Admins belong strictly in their educator/admin dashboard
        if (role === "Admin") {
          window.location.replace("/admin");
          return;
        }
        if (role === "Teacher") {
          window.location.replace("/teacher");
          return;
        }

        p.setUser(displayName);
        p.say("Welcome back, " + displayName);
        p.go("home", {});
      }
    } catch (e) {
      // Offline fallback for testing
      if (!navigator.onLine) {
        p.setUser(reg ? nm : em.split("@")[0]);
        p.go("home", {});
      } else {
        setErr(e.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return h`<div style=${{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 16px" }}>
    <div class="card" style=${{ 
      maxWidth: 440, 
      width: "100%", 
      padding: "36px 32px", 
      display: "flex", 
      flexDirection: "column", 
      gap: 16,
      boxShadow: "var(--shadow-md)"
    }}>
      
      <!-- Top Branding -->
      <div style=${{ textAlign: "center", marginBottom: 4 }}>
        <div class="brand-logo-wrap lg" style=${{ marginBottom: 10 }}>
          <img
            src="/alamin_logo_cutout.png"
            alt="ALAMIN"
            class="brand-logo-img"
            style=${{ height: 84 }}
          />
        </div>
        <h1 class="sr-only">ALAMIN</h1>
        <p class="mu" style=${{ margin: "2px 0 0 0", fontSize: 13.5, lineHeight: 1.45 }}>
          DepEd Alternative Learning System (ALS)<br />
          A&E Reviewer with AI Study Assistant
        </p>
      </div>

      <!-- Segmented Mode Switcher -->
      <div class="auth-switch">
        <button 
          type="button"
          class=${!reg ? "active" : ""} 
          onClick=${() => { setReg(false); setErr(""); }}
        >
          ${p.T("Sign In")}
        </button>
        <button 
          type="button"
          class=${reg ? "active" : ""} 
          onClick=${() => { setReg(true); setErr(""); }}
        >
          ${p.T("Create Account")}
        </button>
      </div>

      <!-- Error Banner -->
      ${err && h`
        <div class="badge off" style=${{ 
          padding: "10px 14px", 
          borderRadius: "var(--radius)", 
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          fontSize: 13,
          lineHeight: 1.4
        }}>
          <${AlertCircle} size=${16} style=${{ flexShrink: 0 }} />
          <span>${err}</span>
        </div>
      `}

      <!-- Auth Form -->
      <form onSubmit=${handleSubmit} style=${{ display: "flex", flexDirection: "column", gap: 12 }}>
        ${reg && h`
          <div class="input-wrap">
            <span class="in-icon"><${User} size=${17} /></span>
            <input 
              class="in" 
              placeholder=${p.T("Full Name / Display Name")} 
              value=${nm} 
              onInput=${e => { setNm(e.target.value); setErr(""); }}
              autoComplete="name"
            />
          </div>
        `}

        <div class="input-wrap">
          <span class="in-icon"><${Mail} size=${17} /></span>
          <input 
            class="in" 
            type="email"
            placeholder=${p.T("Email Address")} 
            value=${em} 
            onInput=${e => { setEm(e.target.value); setErr(""); }}
            autoComplete="email"
          />
        </div>

        <div class="input-wrap">
          <span class="in-icon"><${Lock} size=${17} /></span>
          <input 
            class="in" 
            type=${showPw ? "text" : "password"} 
            placeholder=${p.T("Password (minimum 8 characters)")} 
            value=${pw} 
            onInput=${e => { setPw(e.target.value); setErr(""); }}
            autoComplete=${reg ? "new-password" : "current-password"}
          />
          <button 
            type="button" 
            class="in-toggle" 
            onClick=${() => setShowPw(!showPw)}
            title=${showPw ? "Hide password" : "Show password"}
          >
            <${showPw ? EyeOff : Eye} size=${16} />
          </button>
        </div>

        <button 
          type="submit"
          class="btn p" 
          disabled=${loading} 
          style=${{ width: "100%", padding: "12px", marginTop: 4 }}
        >
          <span>${loading ? "Processing..." : p.T(reg ? "Create Account" : "Sign In")}</span>
          <${ArrowRight} size=${16} />
        </button>
      </form>

      <!-- Language & Educator Links -->
      <div style=${{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 12, 
        marginTop: 16, 
        paddingTop: 16, 
        borderTop: "1px solid var(--bd)",
        alignItems: "center"
      }}>
        <div class="row sp" style=${{ width: "100%" }}>
          <span class="mu">${p.T("Language")}</span>
          <button 
            type="button"
            class="pill" 
            onClick=${() => p.setLang(p.lang === "en" ? "fil" : "en")}
            style=${{ fontSize: 12.5 }}
          >
            <${Globe} size=${13} />
            <span>${p.lang === "en" ? "English" : "Filipino"}</span>
          </button>
        </div>

        <a 
          href="/teacher" 
          style=${{ 
            fontSize: 13, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6, 
            fontWeight: 500,
            color: "var(--pr)"
          }}
        >
          <span>${p.T("Are you an ALS Teacher? Educator Portal")}</span>
          <${ArrowRight} size=${13} />
        </a>
      </div>

    </div>
  </div>`;
}
