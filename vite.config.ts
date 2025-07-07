/// <reference types="vitest" />
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig(({ mode }) => ({
  plugins: mode === 'test' ? [tsconfigPaths()] : [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  resolve: mode === 'test' ? {
    alias: {
      '~': new URL('./app', import.meta.url).pathname,
    },
  } : undefined,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./app/test/setup.ts'],
  },
}));
