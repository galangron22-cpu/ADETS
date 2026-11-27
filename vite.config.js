/**
 * Vite build, React, PWA Workbox service worker, and local Vercel-style `/api/*` dev-server configuration.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

/** Vite middleware plugin that routes `/api/*` requests through `api/index.js` during local development. */
function apiDevServerPlugin() {
  return {
    name: "api-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) {
          return next();
        }

        try {
          const entryFile = path.resolve(process.cwd(), "api/index.js");
          const mod = await server.ssrLoadModule(entryFile);
          if (typeof mod.default === "function") {
            await mod.default(req, res);
          } else {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No default export function in " + entryFile }));
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
  envPrefix: ["VITE_", "SUPABASE_"],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-chart": ["chart.js"]
        }
      }
    }
  },
  plugins: [
    apiDevServerPlugin(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["alamin_favicon.png", "alamin_logo_cutout.png", "icon-192.png", "icon-512.png"],
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        ignoreURLParametersMatching: [/^v$/],
        cleanupOutdatedCaches: true
      },
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
