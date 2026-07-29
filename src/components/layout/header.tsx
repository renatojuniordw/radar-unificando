'use client';

import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton } from '@mui/material';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useThemeMode } from '@/lib/infrastructure/ui/theme-provider';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export function Header() {
  const { data: session } = useSession();
  const { mode, toggle } = useThemeMode();

  return (
    <AppBar position="sticky" color="primary" sx={{ borderBottom: '4px solid #ccff00' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#ccff00',
                cursor: 'pointer',
                mr: 3,
                whiteSpace: 'nowrap',
              }}
            >
              RADAR UNIFICANDO
            </Typography>
          </Link>

          {session && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button component={Link} href="/perfil" color="inherit" size="small" sx={{ color: 'white', fontSize: 11, fontWeight: 700 }}>
                PERFIL
              </Button>
              <Button component={Link} href="/match" color="inherit" size="small" sx={{ color: 'white', fontSize: 11, fontWeight: 700 }}>
                MATCH
              </Button>
              <Button component={Link} href="/aplicacoes" color="inherit" size="small" sx={{ color: 'white', fontSize: 11, fontWeight: 700 }}>
                CANDIDATURAS
              </Button>
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <IconButton onClick={toggle} size="small" sx={{ color: '#94a3b8', mr: 1 }}>
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>

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
            <Button component={Link} href="/login" color="warning" variant="contained" size="small">
              ENTRAR
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
