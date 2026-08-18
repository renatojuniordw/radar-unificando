import type { Metadata } from 'next';
import { Container, Box } from '@mui/material';

// Páginas de autenticação (login/registro/recuperação de senha) são
// transacionais, sem conteúdo próprio para ranquear — não devem competir
// por indexação com as páginas de marketing do site.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ maxWidth: 400, mx: 'auto' }}>{children}</Box>
    </Container>
  );
}
