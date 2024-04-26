import { defineConfig } from 'vite';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';
import { VitePWA } from 'vite-plugin-pwa';
import { importCSSSheet } from 'vite-plugin-import-css-sheet';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  build: {
    sourcemap: true,
    assetsDir: "code",
    rollupOptions: {
      // for production
      plugins: [nodePolyfills()],
    },
    target: ['chrome109', 'edge112', 'firefox102', 'safari15.6', 'ios15.6']
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      }
    }
  },
  plugins: [
    nodePolyfills(),
    importCSSSheet(),
    VitePWA({
      strategies: "injectManifest",
      injectRegister: null,
      injectManifest: {
        swSrc: 'src/service-worker.ts',
        swDest: 'dist/sw.js',
        globDirectory: 'dist',
        globPatterns: [
          '**/*.{html,js,css,json,png}',
        ],
        injectManifestArgs: {
          compileSrc: true,  // Ensure the source is compiled as an ES module
        }
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    port: 5555
  }
})