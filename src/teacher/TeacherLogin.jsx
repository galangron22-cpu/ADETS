import { useState } from "react";
import { h } from "../shared/html.js";
import { supabase } from "../shared/supabase.js";
import { 
  ShieldCheck, 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle 
} from "../shared/icons.js";

export function TeacherLogin({ onLogin }) {
  const isAdminPath = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  const [isRegister, setIsRegister] = useState(false);
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [nm, setNm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErr("");

    if (!em.includes("@")) {
      setErr("Please enter a valid official email address.");
      return;
    }
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (isRegister && !nm.trim()) {
      setErr("Full Name / Teacher Display Name is required.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister && !isAdminPath) {
        // Teacher registration: role is strictly "Teacher"
        const { data, error } = await supabase.auth.signUp({
          email: em.trim(),
          password: pw,
          options: {
            data: {
              display_name: nm.trim(),
              role: "Teacher"
            }
          }
        });

        if (error) {
          if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already in use")) {
            setErr("Email already registered. Please switch to Sign In.");
          } else {
            setErr(error.message);
          }
          return;
        }

        if (data.user) {
          await supabase.from("profiles").upsert({
            profile_id: data.user.id,
            display_name: nm.trim(),
            role: "Teacher",
            account_status: "Active"
          });
          onLogin({
            profile_id: data.user.id,
            display_name: nm.trim(),
            role: "Teacher",
            account_status: "Active"
          });
        }
      } else {
        // Sign In
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

        // Verify role in profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_id, display_name, role, account_status")
          .eq("profile_id", data.user.id)
          .single();

        if (profile?.account_status === "Suspended") {
          setErr("Your account has been suspended. Please contact the administrator.");
          await supabase.auth.signOut();
          return;
        }

        if (isAdminPath) {
          if (profile?.role === "Admin") {
            onLogin(profile);
          } else {
            setErr("Access denied: Administrator credentials required.");
            await supabase.auth.signOut();
          }
        } else {
          if (profile && (profile.role === "Teacher" || profile.role === "Admin")) {
            onLogin(profile);
          } else {
            setErr("Access denied: Educator credentials required.");
            await supabase.auth.signOut();
          }
        }
      }
    } catch (e) {
      setErr(e.message || "An unexpected error occurred");
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
        <div style=${{ 
          width: 56, 
          height: 56, 
          borderRadius: 16, 
          background: "var(--sf)", 
          color: "var(--pr)", 
          display: "inline-flex", 
          alignItems: "center", 
          justifyContent: "center",
          marginBottom: 12,
          boxShadow: "var(--shadow-xs)"
        }}>
          <${isAdminPath ? ShieldCheck : GraduationCap} size=${28} />
        </div>
        <h2 style=${{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
          ${isAdminPath ? "Administrator Sign In" : "Teacher & Educator Portal"}
        </h2>
        <p class="mu" style=${{ margin: "4px 0 0 0", fontSize: 13 }}>
          DepEd Alternative Learning System (ALS)<br />
          ${isAdminPath ? "System Governance & Curriculum Approvals" : "Assessment Authoring & Division Reports"}
        </p>
      </div>

      <!-- Segmented Mode Switcher (Hidden on /admin; available only on /teacher) -->
      ${!isAdminPath && h`
        <div class="auth-switch">
          <button 
            type="button"
            class=${!isRegister ? "active" : ""} 
            onClick=${() => { setIsRegister(false); setErr(""); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            class=${isRegister ? "active" : ""} 
            onClick=${() => { setIsRegister(true); setErr(""); }}
          >
            Register as Teacher
          </button>
        </div>
      `}

      <!-- Error Alert -->
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
      <form onSubmit=${handleSubmit} style=${{ display: "flex", flexDirection: "column", gap: 14 }}>
        ${isRegister && !isAdminPath && h`
          <div class="input-wrap">
            <span class="in-icon"><${User} size=${17} /></span>
            <input 
              class="in" 
              placeholder="Teacher Full Name" 
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
            placeholder="Official Email Address" 
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
            placeholder="Password (8+ characters)" 
            value=${pw} 
            onInput=${e => { setPw(e.target.value); setErr(""); }}
            autoComplete=${isRegister ? "new-password" : "current-password"}
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
          <span>${loading ? "Processing..." : isRegister ? "Create Teacher Account" : "Sign In to Portal"}</span>
          <${ArrowRight} size=${16} />
        </button>
      </form>

      <!-- Navigation Link: Return to Learner Portal (Strictly no admin links here) -->
      <div style=${{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 10, 
        marginTop: 12, 
        paddingTop: 16, 
        borderTop: "1px solid var(--bd)",
        fontSize: 13,
        textAlign: "center"
      }}>
        <a href="/" style=${{ color: "var(--mu)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <${ArrowLeft} size=${13} />
          <span>Return to Learner Portal</span>
        </a>
      </div>

    </div>
  </div>`;
}
