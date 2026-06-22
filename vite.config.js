import { vitePlugin as remix } from "@vercel/remix/vite";
import { defineConfig } from "vite";

// The Shopify CLI exposes the dev tunnel URL under different names depending on
// the CLI version (SHOPIFY_APP_URL on newer CLIs, HOST/APP_URL on older ones).
// Read all of them so HMR and host allow-listing target the real tunnel instead
// of falling back to a fixed localhost port (which collides across dev runs).
const appUrl =
  process.env.SHOPIFY_APP_URL ||
  process.env.APP_URL ||
  process.env.HOST ||
  "http://localhost";
const host = new URL(appUrl).hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host,
    port: parseInt(process.env.FRONTEND_PORT) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    // `host` is the app URL when the CLI sets SHOPIFY_APP_URL, but the
    // Cloudflare dev tunnel hostname changes every run, so also allow any
    // `*.trycloudflare.com` subdomain (and localhost) to avoid "host not
    // allowed" errors during `shopify app dev`.
    allowedHosts: [host, "localhost", ".trycloudflare.com"],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: false,
      },
    }),
  ],
  build: {
    assetsInlineLimit: 0,
  },
});
