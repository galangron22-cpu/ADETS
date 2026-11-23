import { useState } from "react";
import { h } from "../shared/html.js";
import { supabase } from "../shared/supabase.js";
import { useTheme } from "../shared/hooks.js";
import { 
  X, 
  User, 
  Sun, 
  Moon, 
  Globe, 
  LogOut, 
  Check, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Award,
  RefreshCw 
} from "../shared/icons.js";

export function ProfileModal(p) {
  const { user, setUser, lang, setLang, T, onClose, onLogout, saved = [], att = [], say } = p;
  
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user || "");
  const [savingName, setSavingName] = useState(false);
  const [theme, toggleTheme] = useTheme();

  const isDark = theme === "dark" || (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark");

  const handleSaveName = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    
    setSavingName(true);
    try {
      // Update Supabase auth user metadata if session is active
      const { error } = await supabase.auth.updateUser({
        data: { display_name: trimmed }
      });
      if (error) throw error;
      
      setUser(trimmed);
      setEditingName(false);
      if (say) say("Profile name updated!");
    } catch (err) {
      // Local fallback even if offline
      setUser(trimmed);
      setEditingName(false);
      if (say) say("Name updated locally!");
    } finally {
      setSavingName(false);
    }
  };

  return h`
    <div class="ios-modal-overlay" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="ios-modal-card">
        
        <!-- Modal Top Bar -->
        <div class="row sp" style=${{ alignItems: "center" }}>
          <div class="row" style=${{ gap: 8, alignItems: "center" }}>
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
              <${User} size=${17} />
            </div>
            <b style=${{ fontSize: 16, color: "var(--tx)" }}>Profile & Settings</b>
          </div>

          <button 
            type="button" 
            class="ios-round-btn" 
            style=${{ width: 34, height: 34 }} 
            onClick=${onClose}
            title="Close"
          >
            <${X} size=${16} />
          </button>
        </div>

        <!-- User Information Card -->
        <div class="card" style=${{ 
          background: "linear-gradient(135deg, var(--card), var(--sf))", 
          padding: "16px", 
          borderRadius: 20,
          border: "1px solid var(--bd)"
        }}>
          <div class="row" style=${{ gap: 14, alignItems: "center" }}>
            <div class="ios-avatar-btn" style=${{ width: 52, height: 52, fontSize: 18, flexShrink: 0 }}>
              ${(user || "L").charAt(0).toUpperCase()}
            </div>
            <div style=${{ flex: 1, minWidth: 0 }}>
              ${editingName ? h`
                <form onSubmit=${handleSaveName} style=${{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input 
                    class="in" 
                    style=${{ padding: "6px 10px", fontSize: 14, height: 34 }}
                    value=${newName}
                    onInput=${e => setNewName(e.target.value)}
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    class="btn p" 
                    style=${{ padding: "6px 12px", height: 34, fontSize: 12.5 }}
                    disabled=${savingName || !newName.trim()}
                  >
                    <${Check} size=${14} />
                  </button>
                </form>
              ` : h`
                <div class="row sp" style=${{ alignItems: "center" }}>
                  <b style=${{ fontSize: 17, color: "var(--tx)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    ${user}
                  </b>
                  <button 
                    type="button" 
                    style=${{ background: "none", border: "none", color: "var(--pr)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    onClick=${() => setEditingName(true)}
                  >
                    Edit
                  </button>
                </div>
              `}
              <span class="mu" style=${{ fontSize: 12, display: "block", marginTop: 2 }}>
                DepEd ALS Candidate · Valenzuela City
              </span>
            </div>
          </div>
        </div>

        <!-- Theme Setting: Light / Dark Mode -->
        <div class="card" style=${{ padding: "14px 16px", borderRadius: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div class="row sp" style=${{ alignItems: "center" }}>
            <div class="row" style=${{ gap: 8, alignItems: "center" }}>
              <${isDark ? Moon : Sun} size=${17} color="var(--pr)" />
              <b style=${{ fontSize: 14 }}>Appearance / Theme</b>
            </div>
            <button 
              type="button" 
              class="pill" 
              onClick=${toggleTheme}
              style=${{ fontSize: 12.5, fontWeight: 600 }}
            >
              <${isDark ? Sun : Moon} size=${13} />
              <span>Switch to ${isDark ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>

        <!-- Language Setting: English / Filipino -->
        <div class="card" style=${{ padding: "14px 16px", borderRadius: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div class="row sp" style=${{ alignItems: "center" }}>
            <div class="row" style=${{ gap: 8, alignItems: "center" }}>
              <${Globe} size=${17} color="var(--pr)" />
              <b style=${{ fontSize: 14 }}>Language / Wika</b>
            </div>
            <div class="ios-segmented" style=${{ width: "auto" }}>
              <button 
                type="button" 
                class="ios-segmented-btn ${lang === "en" ? "active" : ""}" 
                onClick=${() => setLang("en")}
                style=${{ padding: "6px 12px", fontSize: 12 }}
              >
                English
              </button>
              <button 
                type="button" 
                class="ios-segmented-btn ${lang === "fil" ? "active" : ""}" 
                onClick=${() => setLang("fil")}
                style=${{ padding: "6px 12px", fontSize: 12 }}
              >
                Filipino
              </button>
            </div>
          </div>
        </div>

        <!-- Data & Sync Overview -->
        <div class="card" style=${{ padding: "14px 16px", borderRadius: 18, background: "var(--sf)", border: "1px solid var(--bd)" }}>
          <b style=${{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--mu)", display: "block", marginBottom: 8 }}>
            Offline Storage & Activity
          </b>
          <div class="row sp" style=${{ fontSize: 13 }}>
            <span>Offline Reviewers</span>
            <b>${saved.length} Package${saved.length === 1 ? "" : "s"}</b>
          </div>
          <div class="row sp" style=${{ fontSize: 13, marginTop: 4 }}>
            <span>Quizzes Completed</span>
            <b>${att.length} Assessment${att.length === 1 ? "" : "s"}</b>
          </div>
        </div>

        <!-- Sign Out Button -->
        <button 
          type="button" 
          class="btn d" 
          style=${{ 
            width: "100%", 
            padding: "12px", 
            borderRadius: 9999, 
            fontWeight: 700, 
            fontSize: 14,
            gap: 8,
            marginTop: 4
          }}
          onClick=${() => {
            onClose();
            onLogout();
          }}
        >
          <${LogOut} size=${16} />
          <span>Sign Out of Account</span>
        </button>

      </div>
    </div>
  `;
}
