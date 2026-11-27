/**
 * Administrator user account governance panel (`Acc`).
 * Allows Admins to filter profiles by role/search query and suspend or reactivate accounts via `/api/admin/accounts/:id/status`.
 */
import { useState, useMemo } from "react";
import { h } from "../shared/html.js";
import { fetchApi } from "../shared/supabase.js";
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Users, 
  ShieldCheck, 
  GraduationCap, 
  User, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Plus 
} from "../shared/icons.js";

export function Acc({ acc, setAcc, say }) {
  const [q, setQ] = useState("");
  const [r, setR] = useState("");

  const toggleStatus = async (item) => {
    const newStatus = item.s === "Active" ? "Suspended" : "Active";
    try {
      if (item.id) {
        await fetchApi(`/api/admin/accounts/${item.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus })
        });
      }
      setAcc(acc.map(x => x === item || x.id === item.id ? { ...x, s: newStatus } : x));
      say && say(`Account marked as ${newStatus}`);
    } catch (e) {
      say && say("Status update failed: " + e.message);
    }
  };

  const { learnersCount, teachersCount, adminsCount, activeCount, suspendedCount } = useMemo(() => {
    let learners = 0, teachers = 0, admins = 0, active = 0, suspended = 0;
    for (const a of acc) {
      if (a.r === "Learner") learners++;
      else if (a.r === "Teacher") teachers++;
      else if (a.r === "Admin") admins++;
      if (a.s === "Active") active++;
      else suspended++;
    }
    return {
      learnersCount: learners,
      teachersCount: teachers,
      adminsCount: admins,
      activeCount: active,
      suspendedCount: suspended
    };
  }, [acc]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return acc.filter(a =>
      (!needle || (a.n || "").toLowerCase().includes(needle)) &&
      (!r || a.r === r)
    );
  }, [acc, q, r]);

  return h`<div style=${{ display: "flex", flexDirection: "column", gap: 18 }}>
    
    <!-- Header -->
    <div class="row sp" style=${{ flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 style=${{ fontSize: 22, fontWeight: 800 }}>Account Governance & Moderation</h2>
        <span class="mu">Manage student enrollments, educator permissions, and security status</span>
      </div>
    </div>

    <!-- Metrics Stat Bar -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon"><${Users} size=${22} /></div>
        <div class="stat-info">
          <span>Total Accounts</span>
          <b>${acc.length}</b>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style=${{ color: "var(--ok)", background: "var(--ok-bg)" }}>
          <${GraduationCap} size=${22} />
        </div>
        <div class="stat-info">
          <span>ALS Learners</span>
          <b>${learnersCount}</b>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style=${{ color: "var(--pr)", background: "var(--sf)" }}>
          <${ShieldCheck} size=${22} />
        </div>
        <div class="stat-info">
          <span>Staff & Teachers</span>
          <b>${teachersCount + adminsCount}</b>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style=${{ 
          color: suspendedCount > 0 ? "var(--bad)" : "var(--ok)", 
          background: suspendedCount > 0 ? "var(--bad-bg)" : "var(--ok-bg)" 
        }}>
          <${suspendedCount > 0 ? UserX : UserCheck} size=${22} />
        </div>
        <div class="stat-info">
          <span>Active / Suspended</span>
          <b>${activeCount} <span style=${{ fontSize: 16, color: "var(--mu)", fontWeight: 500 }}>/ ${suspendedCount}</span></b>
        </div>
      </div>
    </div>

    <!-- Role Filter Pills -->
    <div class="chips" style=${{ gap: 8 }}>
      <button 
        type="button" 
        class="pill ${!r ? "on" : ""}" 
        onClick=${() => setR("")}
      >
        <span>All Accounts</span>
        <span class="side-pill-count">${acc.length}</span>
      </button>

      <button 
        type="button" 
        class="pill ${r === "Learner" ? "on" : ""}" 
        onClick=${() => setR("Learner")}
      >
        <${User} size=${12} />
        <span>Learners</span>
        <span class="side-pill-count">${learnersCount}</span>
      </button>

      <button 
        type="button" 
        class="pill ${r === "Teacher" ? "on" : ""}" 
        onClick=${() => setR("Teacher")}
      >
        <${GraduationCap} size=${12} />
        <span>Teachers</span>
        <span class="side-pill-count">${teachersCount}</span>
      </button>

      <button 
        type="button" 
        class="pill ${r === "Admin" ? "on" : ""}" 
        onClick=${() => setR("Admin")}
      >
        <${ShieldCheck} size=${12} />
        <span>Administrators</span>
        <span class="side-pill-count">${adminsCount}</span>
      </button>
    </div>

    <!-- Search Box -->
    <div class="input-wrap">
      <span class="in-icon"><${Search} size=${16} /></span>
      <input 
        class="in" 
        placeholder="Search accounts by display name or email address..." 
        value=${q} 
        onInput=${e => setQ(e.target.value)}
      />
    </div>

    <!-- Accounts Table -->
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th>Educator / Learner Profile</th>
            <th>Role</th>
            <th>Account Status</th>
            <th>Access Moderation</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.length === 0 ? h`
            <tr>
              <td colspan="4" class="mu" style=${{ textAlign: "center", padding: 28 }}>
                No accounts match the selected search or filter criteria.
              </td>
            </tr>
          ` : filtered.map(a => {
            const isActive = a.s === "Active";
            const RoleIcon = a.r === "Admin" ? ShieldCheck : a.r === "Teacher" ? GraduationCap : User;

            return h`<tr>
              <td style=${{ fontWeight: 600 }}>
                <div class="row" style=${{ gap: 10 }}>
                  <div class="avatar" style=${{ 
                    width: 34, 
                    height: 34, 
                    fontSize: 13, 
                    fontWeight: 700,
                    background: a.r === "Admin" ? "var(--sf)" : a.r === "Teacher" ? "var(--ok-bg)" : "var(--bg)",
                    color: a.r === "Admin" ? "var(--pr)" : a.r === "Teacher" ? "var(--ok)" : "var(--tx)",
                    borderRadius: 10
                  }}>
                    ${(a.n || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span style=${{ display: "block" }}>${a.n}</span>
                    <span class="mu" style=${{ fontSize: 11.5 }}>ID: ${String(a.id || "").slice(0, 12)}...</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge ${a.r === "Admin" ? "on" : ""}" style=${{ fontSize: 11.5 }}>
                  <${RoleIcon} size=${12} />
                  <span>${a.r}</span>
                </span>
              </td>
              <td>
                <span class="badge ${isActive ? "on" : "off"}" style=${{ fontSize: 11.5 }}>
                  <${isActive ? CheckCircle2 : XCircle} size=${12} />
                  <span>${a.s}</span>
                </span>
              </td>
              <td>
                <button 
                  type="button"
                  class="btn ${isActive ? "d" : "p"}" 
                  style=${{ padding: "6px 14px", fontSize: 12.5 }}
                  onClick=${() => toggleStatus(a)}
                >
                  <${isActive ? UserX : UserCheck} size=${13} />
                  <span>${isActive ? "Suspend Access" : "Reactivate"}</span>
                </button>
              </td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>

    <span class="mu">
      Role-Based Access Control (RBAC): Suspended accounts are immediately invalidated and blocked by Supabase Auth security policies.
    </span>
  </div>`;
}
