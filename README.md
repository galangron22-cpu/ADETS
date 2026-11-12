# Alamin (PWA)

Offline-capable Progressive Web Application (PWA) with AI-Assisted Reviewer and Chatbot Support for Alternative Learning System (ALS) Learners of the Department of Education (DepEd) Philippines.

Developed for Pamantasan ng Lungsod ng Valenzuela (PLV) - College of Engineering and Information Technology (CEIT).

---

## Tech Stack
- **Frontend:** React 18, HTM, Vanilla CSS, Chart.js (Analytics)
- **PWA & Offline:** `vite-plugin-pwa` (Workbox Service Worker), IndexedDB (`alamin_offline_db`)
- **Backend / Database:** Supabase (PostgreSQL, Auth, RLS Policies)
- **AI Engine:** Google Gemini API (`gemini-3.1-flash-lite`)
- **Hosting / Serverless:** Vercel

---

## Project Structure
```
├── api/                    # Vercel serverless functions / local Vite API middleware
│   ├── _lib/               # Supabase admin client & server helpers
│   ├── admin/              # User account management, question approval, reports
│   ├── ai/                 # Gemini chat & AI question generation
│   ├── question-sets/      # Curriculum fetching & bundle downloads for offline use
│   ├── quiz-attempts/      # Quiz submission & offline attempt synchronization
│   └── strands/            # Learning strand metadata & topics
├── public/                 # PWA icons and web app manifest assets
├── src/                    # Client application source code
│   ├── main.jsx            # Role-based route code splitting (/ , /teacher, /admin)
│   ├── shared/             # IndexedDB cache, Supabase client, formatting, helpers
│   ├── student/            # Learner interface (Quiz, Offline reviewer, AI Chat, Progress)
│   └── teacher/            # Teacher & Admin portal (Question bank, Approvals, Sets, Reports)
├── index.html              # Single page entry point with mobile viewport & PWA meta
├── vercel.json             # Vercel routing & SPA rewrites
└── vite.config.js          # Vite build config, PWA manifest, local API middleware
```

---

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and supply your Supabase and Gemini credentials:
   ```env
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   GEMINI_API_KEY=<your-gemini-api-key>
   ```

3. **Run local development server:**
   ```bash
   npm run dev
   ```
   - Learner Portal: `http://localhost:5173/`
   - Teacher Portal: `http://localhost:5173/teacher`
   - Admin Portal: `http://localhost:5173/admin`

4. **Production Build & Preview:**
   ```bash
   npm run build
   npm run preview
   ```
