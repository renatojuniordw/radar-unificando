'use client';

import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  return (
    <AppBar position="sticky" color="primary" sx={{ borderBottom: '4px solid #ccff00' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <Link href="/" passHref legacyBehavior>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#ccff00',
                cursor: 'pointer',
                textDecoration: 'none',
                mr: 4,
              }}
            >
              RADAR UNIFICANDO
            </Typography>
          </Link>

          <Box sx={{ flexGrow: 1 }} />

          {session ? (
            <>
              <Typography variant="caption" color="grey.300">
                {session.user?.email}
              </Typography>
              <Button color="warning" variant="contained" size="small" onClick={() => signOut()}>
                SAIR
              </Button>
            </>
          ) : (
            <Link href="/login" passHref legacyBehavior>
              <Button color="warning" variant="contained" size="small">
                ENTRAR
              </Button>
            </Link>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
