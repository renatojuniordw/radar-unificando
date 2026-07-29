'use client';

import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou senha inválidos');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Erro ao fazer login');
    }

    setLoading(false);
  }

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 1, fontSize: '2rem' }}>
        ENTRAR
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Acesse sua conta para usar todos os recursos da plataforma.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Senha"
          type="password"
          fullWidth
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading}
        >
          {loading ? 'ENTRANDO...' : 'ENTRAR'}
        </Button>
      </Box>

      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        Não tem conta?{' '}
        <Link href="/register" style={{ color: '#020617', fontWeight: 700 }}>
          Cadastre-se
        </Link>
      </Typography>
    </Box>
  );
}
