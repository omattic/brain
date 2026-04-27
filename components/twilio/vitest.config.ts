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
    }
  }
});
