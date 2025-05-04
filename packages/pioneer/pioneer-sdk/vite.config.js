import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';
import { name } from './package.json';

export default defineConfig({
  base: './',
  plugins: [
    nodePolyfills(),
    dts({ skipDiagnostics: false, clearPureImport: true, rollupTypes: true }),
  ],
  build: {
    lib: {
      name,
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'cjs' ? 'cjs' : 'es.js'}`,
    },
    commonjsOptions: { transformMixedEsModules: true },
    rollupOptions: {
      output: {
        preserveModules: false,
        sourcemap: true,
        exports: 'default',
      }
    }
  }
});
