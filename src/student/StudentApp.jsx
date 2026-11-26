/**
 * Root controller for the Student Portal PWA (`/`).
 * Manages Supabase learner session, online/offline connectivity, IndexedDB offline bundle caching,
 * bilingual translations (`T`), theme state, and shared navigation state.
 */
// STUDENT PORTAL (route: /) – React PWA for ALS learners
import { useState, useEffect } from "react";
import { h } from "../shared/html.js";
import { usePersist, saveDownloadedSet, getAllDownloadedSets, removeDownloadedSet } from "../shared/db.js";
import { useTheme, useToast } from "../shared/hooks.js";
import { L, S as defaultStrands, mkQ, mkSets } from "../shared/data.js";
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
  const [strands, setStrands] = useState(defaultStrands);
  const [liveSets, setLiveSets] = useState(mkSets);
  const [offlineBundles, setOfflineBundles] = useState([]);
  const [saved, setSaved] = usePersist("al-saved", [1]);
  const [att, setAtt] = usePersist("al-att", []);
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

  // Sync online status with browser events
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
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

  // Fetch live strands and sets when online, load offline bundles from IndexedDB
  useEffect(() => {
    getAllDownloadedSets().then(bundles => {
      setOfflineBundles(bundles);
      if (bundles.length > 0) {
        const savedIds = bundles.map(b => b.id);
        setSaved(prev => Array.from(new Set([...prev, ...savedIds])));
      }
    });

    if (online) {
      fetchApi("/api/strands")
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

      fetchApi("/api/question-sets")
        .then(res => {
          if (res.question_sets && res.question_sets.length > 0) {
            setLiveSets(res.question_sets.map((s, idx) => ({
              id: s.id,
              strand_id: s.strand_id,
              title: s.title,
              ver: s.ver,
              status: s.status,
              question_count: s.question_count || 10
            })));
          }
        })
        .catch(() => {});
    }
  }, [online]);

  // Download question set bundle for offline use
  const handleDownload = async (setId) => {
    try {
      say("Downloading set for offline use...");
      const res = await fetchApi(`/api/question-sets/${setId}/download`);
      if (res.bundle) {
        await saveDownloadedSet(res.bundle);
        setOfflineBundles(prev => [...prev.filter(b => b.id !== setId), res.bundle]);
        setSaved(prev => Array.from(new Set([...prev, setId])));
        say("Downloaded for offline");
      }
    } catch (e) {
      say("Failed to download: " + e.message);
    }
  };

  const handleRemove = async (setId) => {
    await removeDownloadedSet(setId);
    setOfflineBundles(prev => prev.filter(b => b.id !== setId));
    setSaved(prev => prev.filter(id => id !== setId));
    say("Removed from offline storage");
  };

  const allSets = [...liveSets];
  for (const b of offlineBundles) {
    if (!allSets.some(s => s.id === b.id)) {
      allSets.push({
        id: b.id,
        strand_id: b.strand_id,
        title: b.title,
        ver: b.ver,
        status: "Published",
        question_count: b.questions?.length || 10
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
    strands,
    sets: allSets,
    offlineBundles,
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
