import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { searchForWorkspaceRoot } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

const sharedDirectory = fileURLToPath(new URL('../lambda/shared', import.meta.url));
const assetsDirectory = fileURLToPath(new URL('../assets', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@shared': sharedDirectory } },
  server: { fs: { allow: [searchForWorkspaceRoot(process.cwd()), sharedDirectory, assetsDirectory] } },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
