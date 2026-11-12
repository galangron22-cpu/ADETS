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

  // Check active Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const name = session.user.user_metadata?.display_name || session.user.email.split("@")[0];
        setUser(name);
        setScr("home");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.display_name || session.user.email.split("@")[0];
        setUser(name);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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

  return h`<div>
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
          <${GraduationCap} size=${18} />
        </div>
        <b>ALAMIN · ${T("Learner Portal")}</b>
      </div>

      <button 
        type="button"
        class="pill" 
        onClick=${() => setLang(lang === "en" ? "fil" : "en")}
        title="Toggle Language (English / Filipino)"
      >
        <${Globe} size=${13} />
        <span>${lang === "en" ? "EN | fil" : "en | FIL"}</span>
      </button>

      <button 
        type="button"
        class="pill" 
        onClick=${() => setOnline(!online)}
        title="Toggle online/offline simulator for testing"
      >
        <${online ? Wifi : WifiOff} size=${14} color=${online ? "var(--ok)" : "var(--bad)"} />
        <span>${T(online ? "Online" : "Offline")}</span>
      </button>

      ${installPrompt && h`
        <button 
          type="button"
          class="pill" 
          style=${{ background: "var(--pr)", color: "#ffffff", fontWeight: 700 }} 
          onClick=${handleInstallApp}
        >
          <${Download} size=${14} />
          <span>Install App</span>
        </button>
      `}

      <button 
        type="button"
        class="pill" 
        onClick=${toggleTheme}
        title="Toggle Theme"
      >
        <${Sparkles} size=${13} />
        <span>Theme</span>
      </button>

      <a class="pill" href="/teacher">
        <span>Teacher Portal</span>
        <${ArrowRight} size=${13} />
      </a>
    </header>

    <${StudentLayout} ...${P} scr=${scr}/>
    ${toast && h`<div class="toast">${toast}</div>`}
  </div>`;
}
