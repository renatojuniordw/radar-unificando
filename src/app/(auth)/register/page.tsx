'use client';

import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Senhas não conferem');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao criar conta');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('Erro ao criar conta');
    }

    setLoading(false);
  }

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 1, fontSize: '2rem' }}>
        CRIAR CONTA
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Crie sua conta para salvar empresas, vagas e acompanhar candidaturas.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Nome"
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
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
          helperText="Mínimo 8 caracteres"
          sx={{ mb: 2 }}
        />
        <TextField
          label="Confirmar senha"
          type="password"
          fullWidth
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
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
          {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
        </Button>
      </Box>

      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        Já tem conta?{' '}
        <Link href="/login" style={{ color: '#020617', fontWeight: 700 }}>
          Entrar
        </Link>
      </Typography>
    </Box>
  );
}
