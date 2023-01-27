import { defineConfig, loadEnv, UserConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'CI');
  if (env.CI) {
    return {
      build: {
        commonjsOptions: { include: [] },
        polyfillModulePreload: false,
        rollupOptions: {
          output: {
            // assetFileNames: '[name].[extname]',
            // entryFileNames: '[name].js',
            preserveModules: true,
          },
        },
        sourcemap: true,
      },
      optimizeDeps: { disabled: false },
    }
  }
  return {
    build: {
      commonjsOptions: { include: [] },
      target: 'esnext',
      lib: {
        entry: 'src/index.ts',
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
  } as UserConfig;
});
