// Entry: "/" = student portal, "/teacher" = teacher portal, "/admin" = admin portal
import { registerSW } from "virtual:pwa-register";
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { h } from "./shared/html.js";
import "./shared/base.css";

// Automatically register Workbox service worker for full offline capability
registerSW({ immediate: true });

const isStaff = location.pathname.startsWith("/admin") || location.pathname.startsWith("/teacher");
const Portal = lazy(() => isStaff ? import("./teacher/TeacherApp.jsx") : import("./student/StudentApp.jsx"));
createRoot(document.getElementById("root")).render(h`<${Suspense} fallback=${h`<p style=${{padding:20}}>Loading…</p>`}><${Portal}/><//>`);
