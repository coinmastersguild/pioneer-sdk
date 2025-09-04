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
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    sourcemap: false,
    rollupOptions: {
      external: ['react', 'uuid', '@chakra-ui/react', '@tanstack/react-query'],
      output: {
        preserveModules: true,
        exports: 'named',
      },
    },
  },
  plugins: [
    dts({
      rollupTypes: false,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    }),
  ],
});

export default viteConfig;
