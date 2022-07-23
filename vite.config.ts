import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'CI');
  if (env.CI) {
    return {
      build: {
        commonjsOptions: { include: [] },
        polyfillModulePreload: false,
        sourcemap: true,
      },
      optimizeDeps: { disabled: false },
    };
  }
  return {
    build: {
      commonjsOptions: { include: [] },
      target: 'esnext',
      lib: {
        entry: 'src/a11y-dialog.ts',
        formats: ['es'],
      },
      minify: false,
      rollupOptions: {
        external: ['focusable-selectors'],
        output: {
          preserveModules: true,
          entryFileNames: '[name].js',
        },
      },
    },
    optimizeDeps: { disabled: false },
    server: {
      open: true,
      port: 3000,
    },
  };
});
