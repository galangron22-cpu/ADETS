// Entry: "/" = student portal, "/admin" = teacher/admin portal (code-split, loaded separately)
import {lazy,Suspense} from "react";
import {createRoot} from "react-dom/client";
import {h} from "./shared/html.js";
import "./shared/base.css";
const Portal=lazy(()=>location.pathname.startsWith("/admin")?import("./teacher/TeacherApp.jsx"):import("./student/StudentApp.jsx"));
createRoot(document.getElementById("root")).render(h`<${Suspense} fallback=${h`<p style=${{padding:20}}>Loading…</p>`}><${Portal}/><//>`);
