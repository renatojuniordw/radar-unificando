import { Container, Box } from '@mui/material';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ maxWidth: 400, mx: 'auto' }}>{children}</Box>
    </Container>
  );
}
