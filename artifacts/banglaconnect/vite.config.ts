import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// -------------------- PORT SAFE FALLBACK --------------------
const port = Number(process.env.PORT ?? 3000);

// -------------------- CONFIG --------------------
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),

    // Replit dev tools (only in dev)
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(process.cwd(), ".."),
            })
          ),
          import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner()
          ),
        ]
      : []),
  ],

  // -------------------- PATH ALIAS --------------------
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },

  // -------------------- ROOT --------------------
  root: process.cwd(),

  // -------------------- BUILD --------------------
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
  },

  // -------------------- DEV SERVER --------------------
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
  },

  // -------------------- PREVIEW --------------------
  preview: {
    port,
    host: "0.0.0.0",
  },
});
