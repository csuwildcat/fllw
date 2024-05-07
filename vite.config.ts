import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { importCSSSheet } from 'vite-plugin-import-css-sheet';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  build: {
    sourcemap: true,
    assetsDir: "code",
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
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        }),
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  plugins: [
    importCSSSheet(),
    VitePWA({
      strategies: "injectManifest",
      registerType: 'autoUpdate',
      // injectRegister: null,
      injectManifest: {
        swSrc: 'public/sw.ts',
        swDest: 'public/sw.js',
        globDirectory: 'dist',
        globPatterns: [
          '**/*.{html,js,css,json,png}',
        ]
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