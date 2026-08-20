import type { NextConfig } from 'next';
import path from 'path';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // CSP redundante (defense-in-depth): o nginx já define um CSP, mas esta camada
  // garante proteção quando a app é servida sem o proxy (dev local, outro host).
  // 'unsafe-inline' em style-src é exigido pelo MUI/emotion (styles injetados);
  // 'unsafe-inline' em script-src cobre scripts inline do Next.js/GA4/Impact/
  // Cloudflare. 'unsafe-eval' foi removido em produção: não é necessário e é o
  // vetor mais perigoso para XSS via CSP bypass; mantido apenas em dev, pois o
  // HMR/React dev tooling do Next usa eval(). Os domínios de terceiros abaixo
  // precisam estar em script-src, senão o CSP BLOQUEIA o GA4 (@next/third-parties),
  // o tracking da Impact (loader inline cria <script> externo de utt.impactcdn.com)
  // e o Cloudflare Web Analytics (beacon.min.js, habilitado no painel do
  // Cloudflare do domínio) — regressão funcional (validação 13/08, item V-1).
  // object-src/base-uri/form-action/frame-ancestors restringem vetores
  // clássicos de XSS/clickjacking.
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; " +
      `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval' " : ''}` +
      'https://www.googletagmanager.com https://www.google-analytics.com ' +
      'https://utt.impactcdn.com https://static.cloudflareinsights.com; ' +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none'; " +
      "worker-src 'self' blob:",
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Separa o diretório de build do de dev: `next build` e `next dev` compartilham
  // `.next` por padrão, e rodar um build enquanto o dev está ativo corrompe o cache
  // do dev (routes-manifest.json some -> 500 em tudo). Para validar builds sem
  // derrubar o dev: NEXT_DIST_DIR=.next-check npm run build
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['@prisma/client', 'pdfjs-dist', 'pg', '@prisma/adapter-pg', '@react-pdf/renderer', 'docx'],
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
