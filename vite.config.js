import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";

function apiDevServerPlugin() {
  return {
    name: "api-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
          let p = urlObj.pathname.replace(/^\/api\/?/, "").split("?")[0];

          let resolvedFile = null;
          let queryParams = Object.fromEntries(urlObj.searchParams);

          // Direct files or index.js
          const directFile = path.resolve(process.cwd(), `api/${p}.js`);
          const indexFile = path.resolve(process.cwd(), `api/${p}/index.js`);

          if (fs.existsSync(directFile)) {
            resolvedFile = directFile;
          } else if (fs.existsSync(indexFile)) {
            resolvedFile = indexFile;
          } else {
            // Pattern matches for dynamic [id] routes
            const parts = p.split("/");
            if (parts.length === 3 && parts[0] === "strands" && parts[2] === "topics") {
              resolvedFile = path.resolve(process.cwd(), "api/strands/[id]/topics.js");
              queryParams.id = parts[1];
            } else if (parts.length === 3 && parts[0] === "question-sets" && parts[2] === "download") {
              resolvedFile = path.resolve(process.cwd(), "api/question-sets/[id]/download.js");
              queryParams.id = parts[1];
            } else if (parts.length === 3 && parts[0] === "admin" && parts[1] === "questions") {
              resolvedFile = path.resolve(process.cwd(), "api/admin/questions/[id].js");
              queryParams.id = parts[2];
            } else if (parts.length === 4 && parts[0] === "admin" && parts[1] === "question-sets" && parts[3] === "publish") {
              resolvedFile = path.resolve(process.cwd(), "api/admin/question-sets/[id]/publish.js");
              queryParams.id = parts[2];
            } else if (parts.length === 4 && parts[0] === "admin" && parts[1] === "accounts" && parts[3] === "status") {
              resolvedFile = path.resolve(process.cwd(), "api/admin/accounts/[id]/status.js");
              queryParams.id = parts[2];
            }
          }

          if (!resolvedFile || !fs.existsSync(resolvedFile)) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: `API route not found: /api/${p}` }));
            return;
          }

          req.query = queryParams;

          // Load serverless function using Vite SSR loader
          const mod = await server.ssrLoadModule(resolvedFile);
          if (typeof mod.default === "function") {
            await mod.default(req, res);
          } else {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No default export function in " + resolvedFile }));
          }
        } catch (err) {
          console.error("API Dev Server Error:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message }));
          }
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    apiDevServerPlugin(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png}"], navigateFallback: "/index.html" },
      manifest: {
        name: "Alamin – ALS Reviewer",
        short_name: "Alamin",
        description: "Offline-capable AI-assisted reviewer for DepEd ALS learners",
        theme_color: "#1f6feb",
        background_color: "#f4f6fb",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      }
    })
  ]
});
