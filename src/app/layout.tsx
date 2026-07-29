import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/infrastructure/ui/theme-provider';
import { AuthProvider } from '@/lib/infrastructure/ui/auth-provider';
import { SnackbarProvider } from '@/hooks/useSnackbar';
import { Header, Footer } from '@/components/layout';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Radar Unificando — Vagas Gupy + InHire',
  description: 'Busca automática de vagas 100% remotas em Gupy e InHire para cargos de Dados, BI, Business e Growth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <ThemeProvider>
            <SnackbarProvider>
              <Header />
              <main style={{ flex: 1 }}>{children}</main>
              <Footer />
            </SnackbarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
