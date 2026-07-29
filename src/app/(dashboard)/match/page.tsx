'use client';

import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, LinearProgress, Button, Alert, Skeleton,
} from '@mui/material';
import Link from 'next/link';

interface MatchResult {
  jobId: string;
  empresa: string;
  tituloVaga: string;
  plataforma: string;
  link: string;
  score: number;
  matchedSkills: string[];
  missingMandatory: string[];
  evidence: string[];
}

export default function MatchPage() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/match')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          setError(data.error || 'Erro ao carregar match');
        }
      })
      .catch(() => setError('Erro ao carregar match'))
      .finally(() => setLoading(false));
  }, []);

  function getScoreColor(score: number): string {
    if (score >= 70) return '#16a34a';
    if (score >= 40) return '#ffaa00';
    return '#dc2626';
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        MATCH DE VAGAS
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Compatibilidade do seu perfil com cada vaga encontrada.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 0.5 }} />
          ))}
        </Box>
      ) : error ? (
        <Alert severity="info" sx={{ borderRadius: 1 }}>
          {error}
          <Box sx={{ mt: 2 }}>
            <Link href="/perfil" passHref legacyBehavior>
              <Button variant="contained" component="a">CRIAR PERFIL</Button>
            </Link>
          </Box>
        </Alert>
      ) : results.length === 0 ? (
        <Alert severity="info">
          Nenhuma vaga para comparar. Execute o pipeline primeiro.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#020617' }}>
                <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>EMPRESA</TableCell>
                <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>VAGA</TableCell>
                <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>PLAT</TableCell>
                <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>SCORE</TableCell>
                <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>SKILLS</TableCell>
                <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>AÇÃO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.jobId} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{r.empresa}</TableCell>
                  <TableCell>{r.tituloVaga}</TableCell>
                  <TableCell>
                    <Chip label={r.plataforma} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 900, color: getScoreColor(r.score), minWidth: 40 }}
                      >
                        {r.score}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={r.score}
                        sx={{
                          width: 80,
                          height: 8,
                          borderRadius: 1,
                          bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': { bgcolor: getScoreColor(r.score) },
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {r.matchedSkills.slice(0, 3).map(s => (
                        <Chip key={s} label={s} size="small" color="success" variant="outlined" sx={{ fontSize: 10 }} />
                      ))}
                      {r.missingMandatory.slice(0, 2).map(s => (
                        <Chip key={s} label={s} size="small" color="error" variant="outlined" sx={{ fontSize: 10 }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      href={r.link}
                      target="_blank"
                      size="small"
                      variant="contained"
                      sx={{ fontSize: 11, fontWeight: 700 }}
                    >
                      CANDIDATAR
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
