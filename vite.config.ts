import { defineConfig, UserConfig } from 'vite';
import terser from '@rollup/plugin-terser';

const plugins = [terser()];

const umdConfig = {
  format: 'umd',
  globals: { 'focusable-selectors': 'focusableSelectors' },
  name: 'A11yDialogWC',
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      target: 'esnext',
      minify: false,
      modulePreload: false,
      commonjsOptions: { include: [] },
      rollupOptions: {
        input: 'src/index.ts',
        output: [
          {
            format: 'es',
            entryFileNames: '[name].js',
          },
          {
            format: 'es',
            entryFileNames: '[name].min.js',
            plugins,
          },
          {
            ...umdConfig,
            entryFileNames: '[name].umd.js',
          },
          {
            ...umdConfig,
            plugins,
            entryFileNames: '[name].umd.min.js',
          },
        ],
      },
    },
    optimizeDeps: { disabled: false },
    server: {
      open: true,
      port: 3000,
    },
  } as UserConfig;
});
