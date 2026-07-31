import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Box } from '@mui/material';
import { ThemeProvider } from '@/lib/infrastructure/ui/theme-provider';
import { AuthProvider } from '@/lib/infrastructure/ui/auth-provider';
import { SnackbarProvider } from '@/hooks/useSnackbar';
import { QueryProvider } from '@/lib/infrastructure/ui/query-provider';
import { ChatAssistantProvider } from '@/contexts/chat-assistant-context';
import { ChatAssistantUI } from '@/components/chat-assistant-ui';
import { Header, Footer } from '@/components/layout';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Radar Unificando — Vagas Gupy + InHire',
  description: 'Busca automática de vagas em Gupy e InHire para cargos de Dados, BI, Business e Growth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <ThemeProvider>
            <SnackbarProvider>
              <QueryProvider>
                <ChatAssistantProvider>
                  {/* Skip link for keyboard navigation */}
                  <Box
                    component="a"
                    href="#main-content"
                    sx={{
                      position: 'absolute',
                      top: -40,
                      left: 0,
                      zIndex: 9999,
                      p: 2,
                      bgcolor: 'primary.main',
                      color: 'common.white',
                      textDecoration: 'none',
                      fontWeight: 700,
                      '&:focus': {
                        top: 0,
                      },
                    }}
                  >
                    Pular para conteúdo principal
                  </Box>
                  
                  <Header />
                  <main id="main-content" style={{ flex: 1 }}>{children}</main>
                  <Footer />
                  <ChatAssistantUI />
                </ChatAssistantProvider>
              </QueryProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
