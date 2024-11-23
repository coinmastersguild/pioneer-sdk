// import thorswapViteConfig from '@internal/config';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { name } from './package.json';

const viteConfig = defineConfig({
  build: {
    lib: {
      name,
      entry: resolve(__dirname, 'src/index.tsx'),
      formats: ['es'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'uuid'],
    },
  },
  plugins: [dts()],
});

export default viteConfig;
