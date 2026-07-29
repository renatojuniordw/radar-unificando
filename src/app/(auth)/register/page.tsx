'use client';

import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    setErrors({});

    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
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
        setApiError(data.error || 'Erro ao criar conta');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setApiError('Erro ao criar conta');
    }
    setLoading(false);
  }

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 1, fontSize: '2rem' }}>CRIAR CONTA</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Crie sua conta para salvar empresas, vagas e acompanhar candidaturas.
      </Typography>

      {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField label="Nome" fullWidth value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2 }} />
        <TextField label="Email" type="email" fullWidth required value={email} onChange={e => setEmail(e.target.value)} error={!!errors.email} helperText={errors.email} sx={{ mb: 2 }} />
        <TextField label="Senha" type="password" fullWidth required value={password} onChange={e => setPassword(e.target.value)} error={!!errors.password} helperText={errors.password || 'Mínimo 8 caracteres'} sx={{ mb: 2 }} />
        <TextField label="Confirmar senha" type="password" fullWidth required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} error={!!errors.confirmPassword} helperText={errors.confirmPassword} sx={{ mb: 3 }} />
        <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={loading}>
          {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
        </Button>
      </Box>

      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        Já tem conta?{' '}
        <Link href="/login" style={{ color: '#020617', fontWeight: 700 }}>Entrar</Link>
      </Typography>
    </Box>
  );
}
