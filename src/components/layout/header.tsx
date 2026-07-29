'use client';

import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  return (
    <AppBar position="sticky" color="primary" sx={{ borderBottom: '4px solid #ccff00' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          <Link href="/" passHref legacyBehavior>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#ccff00',
                cursor: 'pointer',
                textDecoration: 'none',
                mr: 3,
                whiteSpace: 'nowrap',
              }}
            >
              RADAR UNIFICANDO
            </Typography>
          </Link>

          {session && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Link href="/perfil" passHref legacyBehavior>
                <Button color="inherit" size="small" sx={{ color: 'white', fontSize: 11, fontWeight: 700 }}>
                  PERFIL
                </Button>
              </Link>
              <Link href="/match" passHref legacyBehavior>
                <Button color="inherit" size="small" sx={{ color: 'white', fontSize: 11, fontWeight: 700 }}>
                  MATCH
                </Button>
              </Link>
              <Link href="/aplicacoes" passHref legacyBehavior>
                <Button color="inherit" size="small" sx={{ color: 'white', fontSize: 11, fontWeight: 700 }}>
                  CANDIDATURAS
                </Button>
              </Link>
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="grey.300" sx={{ display: { xs: 'none', md: 'block' } }}>
                {session.user?.email}
              </Typography>
              <Button color="warning" variant="contained" size="small" onClick={() => signOut()}>
                SAIR
              </Button>
            </Box>
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
