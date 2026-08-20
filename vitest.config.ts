import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  test: {
    globals: true,
    environment: 'node',
    // next-auth importa 'next/server' via ESM nativo; sem exports map no next,
    // o Node não resolve quando o next-auth é externalizado. Inline faz o Vite
    // transformar o next-auth e resolver 'next/server' corretamente.
    server: {
      deps: {
        inline: ['next-auth', '@testing-library/react', '@testing-library/dom', 'react', 'react-dom', '@mui/material', '@mui/icons-material'],
      },
    },
    exclude: ['e2e/**', 'node_modules/**', '.agents/**', 'src/__tests__/coverage/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/__tests__/**',
        'src/types/**',
        'src/**/*.config.{ts,tsx}',
        'src/**/prisma-client.ts',
      ],
      reportsDirectory: './coverage',
    },
  },
  resolve: {
    alias: [
      { find: /^react-dom$/, replacement: path.resolve(__dirname, './node_modules/react-dom/index.js') },
      { find: /^react-dom\/(.*)$/, replacement: path.resolve(__dirname, './node_modules/react-dom/$1') },
      { find: /^react$/, replacement: path.resolve(__dirname, './node_modules/react/index.js') },
      { find: /^react\/(.*)$/, replacement: path.resolve(__dirname, './node_modules/react/$1') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});
