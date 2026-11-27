/**
 * Root controller for the Student Portal PWA (`/`).
 * Manages Supabase learner session, online/offline connectivity, IndexedDB offline bundle caching,
 * bilingual translations (`T`), theme state, and shared navigation state.
 */
// STUDENT PORTAL (route: /) – React PWA for ALS learners
import { useState, useEffect, useRef } from "react";
import { h } from "../shared/html.js";
import { usePersist, saveDownloadedSet, getAllDownloadedSets, removeDownloadedSet } from "../shared/db.js";
import { useTheme, useToast } from "../shared/hooks.js";
import { L, S as defaultStrands, mkQ } from "../shared/data.js";
import { supabase, fetchApi } from "../shared/supabase.js";
import { StudentLayout } from "./StudentLayout.jsx";
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Sparkles, 
  ArrowRight, 
  GraduationCap,
  Globe 
} from "../shared/icons.js";
import "./student.css";

export default function StudentApp() {
  const [lang, setLang] = usePersist("al-lang", "en");
  const [online, setOnline] = useState(navigator.onLine);
  const [, toggleTheme] = useTheme();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [scr, setScr] = useState("login");
  const [ctx, setCtx] = useState({});
  const [strands, setStrands] = usePersist("al-strands", defaultStrands);
  const [liveSets, setLiveSets] = usePersist("al-sets", []);
  const [offlineBundles, setOfflineBundles] = useState([]);
  const [onlineBundles, setOnlineBundles] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [saved, setSaved] = usePersist("al-saved", []);
  const [att, setAtt] = usePersist("al-att", []);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const attRef = useRef(att);
  attRef.current = att;
  const syncLockRef = useRef(false);
  const [toast, say] = useToast();
  const [installPrompt, setInstallPrompt] = useState(null);

  // Capture PWA install prompt for smartphones and desktops
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      say("Alamin installed to home screen!");
    }
    setInstallPrompt(null);
  };

  const T = k => (lang === "fil" && L.fil[k]) || k;
  const go = (s, c) => {
    setScr(s);
    if (c) setCtx(c);
  };

  // Sync online status with browser events and Android foreground/visibility wakeups
  useEffect(() => {
    const syncConnectivity = () => setOnline(navigator.onLine);
    window.addEventListener("online", syncConnectivity);
    window.addEventListener("offline", syncConnectivity);
    window.addEventListener("focus", syncConnectivity);
    document.addEventListener("visibilitychange", syncConnectivity);
    return () => {
      window.removeEventListener("online", syncConnectivity);
      window.removeEventListener("offline", syncConnectivity);
      window.removeEventListener("focus", syncConnectivity);
      document.removeEventListener("visibilitychange", syncConnectivity);
    };
  }, []);

  // Check active Supabase session & enforce role isolation (including browser back/bfcache pageshow)
  useEffect(() => {
    let active = true;

    const verifyLearnerSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        if (!session?.user) {
          setUser(null);
          setScr("login");
          setAuthChecked(true);
          return;
        }

        let role = session.user.user_metadata?.role;
        let displayName = session.user.user_metadata?.display_name || session.user.email.split("@")[0];

        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name, role, account_status")
            .eq("profile_id", session.user.id)
            .single();

          if (prof) {
            role = prof.role || role;
            displayName = prof.display_name || displayName;
            if (prof.account_status === "Suspended") {
              await supabase.auth.signOut();
              if (active) {
                setUser(null);
                setScr("login");
                setAuthChecked(true);
              }
              return;
            }
          }
        } catch (e) {}

        // Teachers & Admins can only view their dedicated portal dashboard
        if (role === "Admin") {
          window.location.replace("/admin");
          return;
        }
        if (role === "Teacher") {
          window.location.replace("/teacher");
          return;
        }

        if (active) {
          setUser(displayName);
          setScr(prev => (prev === "login" ? "home" : prev));
          setAuthChecked(true);
        }
      } catch (e) {
        if (active) setAuthChecked(true);
      }
    };

    verifyLearnerSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setScr("login");
        setAuthChecked(true);
      } else {
        verifyLearnerSession();
      }
    });

    const onPageShow = () => verifyLearnerSession();
    window.addEventListener("pageshow", onPageShow);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // Hydrate offline downloaded question bundles from IndexedDB once on mount
  useEffect(() => {
    getAllDownloadedSets().then(bundles => {
      const validBundles = (bundles || []).filter(b => isCloudId(b?.id));
      setOfflineBundles(validBundles);
      setSaved(validBundles.map(b => b.id));
    });
  }, []);

  const isCloudId = id => typeof id === "string" && id.includes("-");

  const refreshCloudAttempts = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.access_token) return;
      const res = await fetchApi("/api/quiz-attempts");
      if (!Array.isArray(res?.attempts)) return;
      setAtt(prev => {
        const cloudList = res.attempts;
        const findMatch = (list, targetSetId, targetCompletedAt, targetAttemptId) =>
          list.find(item =>
            item.attempt_id === targetAttemptId ||
            (targetCompletedAt &&
              item.completed_at &&
              item.completed_at === targetCompletedAt &&
              (item.set ?? item.question_set_id ?? item.set_id ?? item.setId) === targetSetId)
          );

        const next = (prev || []).map(local => {
          const localSetId = local.set ?? local.question_set_id ?? local.set_id;
          const match = findMatch(
            cloudList.map(c => ({ ...c, setId: c.set_id })),
            localSetId,
            local.completed_at,
            local.attempt_id
          );
          return match
            ? {
                ...local,
                sync: true,
                set_title: local.set_title || match.set_title || "",
                strand_id: local.strand_id || match.strand_id || null
              }
            : local;
        });

        for (const c of cloudList) {
          const exists = findMatch(next, c.set_id, c.completed_at, c.attempt_id);
          if (!exists) {
            next.push({
              attempt_id: c.attempt_id,
              set: c.set_id,
              set_id: c.set_id,
              question_set_id: c.set_id,
              set_title: c.set_title || "",
              strand_id: c.strand_id || null,
              score: c.score,
              total: c.total,
              date: c.completed_at
                ? new Date(c.completed_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })
                : "Recent",
              completed_at: c.completed_at,
              sync: true
            });
          }
        }

        return next.sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
      });
    } catch (e) {}
  };

  // Fetch live strands and published sets when online (skip auth header overhead on public endpoints)
  useEffect(() => {
    if (!online) return;

    fetchApi("/api/strands", { auth: false })
      .then(res => {
        if (res.strands && res.strands.length > 0) {
          setStrands(res.strands.map((s, idx) => ({
            id: idx,
            strand_id: s.strand_id,
            code: s.code,
            name: `Strand ${idx + 1} – ${s.name}`,
            rawName: s.name
          })));
        }
      })
      .catch(() => {});

    fetchApi("/api/question-sets", { auth: false })
      .then(res => {
        if (Array.isArray(res.question_sets)) {
          setLiveSets(res.question_sets.map(s => ({
            id: s.id,
            strand_id: s.strand_id,
            title: s.title,
            ver: s.ver,
            status: s.status,
            question_count: s.question_count ?? 0
          })));
        }
      })
      .catch(() => {});
  }, [online]);

  // Fetch and merge learner's cloud attempt history when authenticated and online
  useEffect(() => {
    if (online && authChecked && user) {
      refreshCloudAttempts();
    }
  }, [online, authChecked, user]);

  // Fetches an approved published set bundle for online play (without forcing offline storage)
  const loadSetBundle = async (setId) => {
    const existing =
      offlineBundles.find(b => b.id === setId) ||
      onlineBundles.find(b => b.id === setId);
    if (existing) return existing;

    const res = await fetchApi(`/api/question-sets/${setId}/download`, { auth: false });
    if (!res?.bundle) {
      throw new Error("Question set bundle is unavailable.");
    }
    setOnlineBundles(prev => [...prev.filter(b => b.id !== setId), res.bundle]);
    return res.bundle;
  };

  // Download question set bundle for offline use
  const handleDownload = async (setId) => {
    setDownloadingId(setId);
    try {
      say("Downloading set for offline use...");
      const res = await fetchApi(`/api/question-sets/${setId}/download`, { auth: false });
      if (res?.bundle) {
        await saveDownloadedSet(res.bundle);
        setOfflineBundles(prev => [...prev.filter(b => b.id !== setId), res.bundle]);
        setSaved(prev => Array.from(new Set([...prev.filter(isCloudId), setId])));
        say("Downloaded for offline");
      }
    } catch (e) {
      say("Failed to download: " + e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemove = async (setId) => {
    await removeDownloadedSet(setId);
    setOfflineBundles(prev => prev.filter(b => b.id !== setId));
    setSaved(prev => prev.filter(id => id !== setId && isCloudId(id)));
    say("Removed from offline storage");
  };

  const syncPending = async ({ silent = false } = {}) => {
    const isActuallyOnline = typeof navigator === "undefined" ? true : navigator.onLine !== false;
    if (isActuallyOnline && !online) {
      setOnline(true);
    }

    if (!isActuallyOnline) {
      const offlineMsg = "Device is offline. Assessments will automatically upload when reconnected.";
      if (!silent) setSyncError(offlineMsg);
      return { status: "offline", syncedIds: [], errors: [], message: offlineMsg };
    }

    const pending = (attRef.current || []).filter(x => !x.sync);
    if (pending.length === 0) {
      return { status: "empty", syncedIds: [], errors: [] };
    }

    if (syncLockRef.current) {
      return { status: "busy", syncedIds: [], errors: [] };
    }

    syncLockRef.current = true;
    setSyncing(true);
    if (!silent) setSyncError("");

    try {
      const res = await fetchApi("/api/quiz-attempts/sync", {
        method: "POST",
        body: JSON.stringify({
          attempts: pending.map(a => ({
            attempt_id: a.attempt_id,
            question_set_id: a.set ?? a.question_set_id ?? a.set_id,
            started_at: a.started_at || a.completed_at || new Date().toISOString(),
            completed_at: a.completed_at || new Date().toISOString(),
            ans: a.ans || {},
            total: a.total
          }))
        })
      });

      if (!res || typeof res !== "object" || !Array.isArray(res.synced_ids)) {
        const msg = "Unexpected server response while syncing. Please check your connection and try again.";
        setSyncError(msg);
        return { status: "error", syncedIds: [], errors: [], message: msg };
      }

      if (res.synced_ids.length > 0) {
        const syncedSet = new Set(res.synced_ids);
        setAtt(prev => prev.map(x => (syncedSet.has(x.attempt_id) ? { ...x, sync: true } : x)));
        refreshCloudAttempts();
      }

      const apiErrors = Array.isArray(res.errors) ? res.errors : [];
      if (apiErrors.length > 0) {
        const reason = apiErrors.map(e => e.error).filter(Boolean).join("; ") || "Sync rejected by server.";
        const msg = res.synced_ids.length > 0
          ? `Synced ${res.synced_ids.length} assessment(s), but ${apiErrors.length} failed: ${reason}`
          : `Sync failed: ${reason}`;
        setSyncError(msg);
        if (res.synced_ids.length > 0) {
          say(`Synced ${res.synced_ids.length} assessment(s) to cloud!`);
        }
        return { status: "error", syncedIds: res.synced_ids, errors: apiErrors, message: msg };
      }

      if (res.synced_ids.length === 0) {
        const msg = "No assessments could be synced. Please sign in again or retry.";
        setSyncError(msg);
        return { status: "error", syncedIds: [], errors: [], message: msg };
      }

      setSyncError("");
      say(`Synced ${res.synced_ids.length} assessment(s) to cloud!`);
      return { status: "ok", syncedIds: res.synced_ids, errors: [] };
    } catch (err) {
      const lower = (err?.message || "").toLowerCase();
      const msg = (lower.includes("401") || lower.includes("session") || lower.includes("auth") || lower.includes("jwt"))
        ? "Session expired. Please sign in again to sync your progress."
        : `Sync failed: ${err?.message || "Network error"}`;
      if (!silent || !lower.includes("failed to fetch")) {
        setSyncError(msg);
      }
      return { status: "error", syncedIds: [], errors: [{ error: msg }], message: msg };
    } finally {
      syncLockRef.current = false;
      setSyncing(false);
    }
  };

  const pendingCount = att.filter(x => !x.sync).length;
  const autoSyncedOnlineRef = useRef(false);

  // Automatically upload queued offline assessments when internet reconnects with an active session
  useEffect(() => {
    if (!user) {
      setSyncError("");
      autoSyncedOnlineRef.current = false;
      return;
    }
    if (!online) {
      autoSyncedOnlineRef.current = false;
      return;
    }
    if (!authChecked || pendingCount === 0) {
      if (pendingCount === 0) autoSyncedOnlineRef.current = false;
      return;
    }
    if (autoSyncedOnlineRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session?.access_token) return;
      } catch (e) {
        return;
      }
      autoSyncedOnlineRef.current = true;
      syncPending({ silent: true });
    }, 600);

    return () => clearTimeout(timer);
  }, [online, authChecked, user, pendingCount]);

  const allSets = (liveSets || []).filter(s => isCloudId(s?.id));
  for (const b of offlineBundles) {
    if (!allSets.some(s => s.id === b.id)) {
      allSets.push({
        id: b.id,
        strand_id: b.strand_id,
        title: b.title,
        ver: b.ver,
        status: "Published",
        question_count: b.questions?.length ?? 0
      });
    }
  }

  const P = {
    setUser,
    T,
    online,
    setOnline,
    go,
    say,
    saved,
    setSaved,
    att,
    setAtt,
    syncPending,
    syncing,
    syncError,
    clearSyncError: () => setSyncError(""),
    strands,
    sets: allSets,
    offlineBundles,
    onlineBundles,
    loadSetBundle,
    downloadingId,
    downloadSet: handleDownload,
    removeSet: handleRemove,
    qs: mkQ,
    user,
    ctx,
    lang,
    setLang
  };

  if (!authChecked) {
    return h`<div class="student-root" style=${{ alignItems: "center", justifyContent: "center" }}>
      <p class="mu" style=${{ fontSize: 14 }}>Loading…</p>
    </div>`;
  }

  return h`<div class="student-root">
    <${StudentLayout} ...${P} scr=${scr}/>
    ${toast && h`<div class="toast">${toast}</div>`}
  </div>`;
}
