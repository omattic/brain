import { defineConfig } from 'vitest/config';
// import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path';

export default defineConfig({
  // plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/app.ts']
    },
    setupFiles: ['vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src/'),
      '@components': path.resolve(__dirname, './src/components'),
      '@controller': path.resolve(__dirname, './src/controller'),
      '@middlewares': path.resolve(__dirname, './src/middlewares'),
      '@services': path.resolve(__dirname, './src/services'),
      '@testevents': path.resolve(__dirname, './tests/events'),
      '@events': path.resolve(__dirname, './tests/events'),
      '@mocks': path.resolve(__dirname, './tests/mocks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@brain-sdk': path.resolve(__dirname, './src/brain-sdk'),
      '@tmp': path.resolve(__dirname, './src/tmp'),
    }
  }
});
