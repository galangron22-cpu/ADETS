import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {VitePWA} from "vite-plugin-pwa";
export default defineConfig({
 plugins:[react(),VitePWA({
  registerType:"autoUpdate",
  workbox:{globPatterns:["**/*.{js,css,html,svg,png}"],navigateFallback:"/index.html"}, // Workbox precache = app works offline
  manifest:{name:"Alamin – ALS Reviewer",short_name:"Alamin",description:"Offline-capable AI-assisted reviewer for DepEd ALS learners",
   theme_color:"#1f6feb",background_color:"#f4f6fb",display:"standalone",start_url:"/",
   icons:[{src:"icon-192.png",sizes:"192x192",type:"image/png"},{src:"icon-512.png",sizes:"512x512",type:"image/png"},{src:"icon-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}]}
 })]
});
