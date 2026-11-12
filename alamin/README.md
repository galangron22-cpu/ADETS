# Alamin – React PWA (frontend)
    npm install
    npm run dev        # development
    npm run build && npm run preview   # test install + offline mode (service worker is built here)

- Offline: Workbox precaches the app shell (vite-plugin-pwa); downloaded sets and attempts live in IndexedDB (src/db.js).
- Mock data (questions, accounts, reports, chatbot replies) is in src/App.jsx. Replace with calls to the Express API:
  auth, GET published question sets, POST sync queue (quiz_attempts + attempt_answers), admin review/approve/reject, accounts, reports, POST /chat (LLM relay).
- Replace the placeholder logo icons in /public (icon.svg, icon-192.png, icon-512.png).

## Structure
    src/main.jsx            entry – "/" student portal, "/admin" teacher portal (separate lazy-loaded bundles)
    src/shared/             base.css, sample data, IndexedDB helper, hooks
    src/student/            StudentApp, StudentLayout, Login, Quiz, Score, Chat, Progress, student.css
    src/teacher/            TeacherApp, TeacherLayout, TeacherLogin, Dashboard, QuestionBank, QuestionEditor,
                            QuestionSets, Accounts, Reports, teacher.css
vercel.json rewrites every path to index.html so /admin works after deploy.
