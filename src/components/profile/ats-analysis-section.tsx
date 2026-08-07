'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { CheckCircle, ErrorOutline, InfoOutlined } from '@mui/icons-material';
import type { AtsHeuristic } from '@/lib/ats/ats-heuristics';
import type { AtsAnalysis } from '@/lib/ats/ats-analyzer';

interface AtsResult {
  heuristics: AtsHeuristic;
  analysis: AtsAnalysis;
  cached: boolean;
}

function scoreColor(score: number): string {
  if (score < 50) return '#ef4444';
  if (score < 75) return '#f59e0b';
  return '#22c55e';
}

function scoreLabel(score: number): string {
  if (score < 50) return 'Precisa melhorar';
  if (score < 75) return 'Bom';
  return 'Ótimo';
}

export function AtsAnalysisSection() {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jobDescription.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erro ao analisar o currículo.');
        return;
      }
      setResult(await res.json());
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        mt: 3,
        p: 3,
        border: '2px solid #ccff00',
        boxShadow: '6px 6px 0px #ccff00',
        bgcolor: '#0f172a',
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: '#ccff00', mb: 1 }}>
        Análise ATS do currículo
      </Typography>
      <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: 2 }}>
        Descubra se seu currículo passa nos filtros automáticos (ATS) usados pelas empresas. Opcional: cole a
        descrição da vaga para checar as palavras-chave que faltam.
      </Typography>

      <TextField
        label="Descrição da vaga (opcional)"
        multiline
        minRows={2}
        maxRows={5}
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        fullWidth
        size="small"
        placeholder="Cole aqui a descrição da vaga alvo..."
        sx={{ mb: 2, '& .MuiInputBase-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
      />

      <Button
        variant="contained"
        onClick={handleAnalyze}
        disabled={loading}
        aria-busy={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        sx={{
          bgcolor: '#ccff00',
          color: '#020617',
          fontWeight: 900,
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          '&:hover': { bgcolor: '#b8e600' },
          '&.Mui-disabled': { bgcolor: 'grey.600', color: 'grey.400' },
        }}
      >
        {loading ? 'Analisando...' : 'Analisar compatibilidade ATS'}
      </Button>

      {error && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: '#f87171' }}>
          <ErrorOutline sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.8rem' }}>{error}</Typography>
        </Box>
      )}

      {result && (
        <Box sx={{ mt: 3 }}>
          {/* Score */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                border: `6px solid ${scoreColor(result.analysis.score)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: scoreColor(result.analysis.score) }}>
                {result.analysis.score}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                {scoreLabel(result.analysis.score)}
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                {result.cached ? 'Resultado em cache (currículo já analisado).' : 'Score de compatibilidade ATS (0-100).'}
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ color: '#e2e8f0', fontSize: '0.85rem', mb: 2 }}>{result.analysis.summary}</Typography>

          {/* Heurísticas (checklist instantâneo) */}
          <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', color: '#ccff00', mb: 1 }}>
            Checklist rápido
          </Typography>
          <Box sx={{ mb: 2 }}>
            {result.heuristics.checks.map((c) => (
              <Box key={c.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                {c.ok ? (
                  <CheckCircle sx={{ fontSize: 16, color: '#22c55e', mt: 0.3 }} />
                ) : (
                  <ErrorOutline sx={{ fontSize: 16, color: '#f59e0b', mt: 0.3 }} />
                )}
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.8rem' }}>
                  <strong>{c.label}:</strong> {c.detail}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Keywords faltando */}
          {result.analysis.missingKeywords.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', color: '#ccff00', mb: 1 }}>
                Palavras-chave faltando
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {result.analysis.missingKeywords.map((k) => (
                  <Box key={k} sx={{ bgcolor: '#1e293b', border: '1px solid #f59e0b', color: '#fbbf24', px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>
                    {k}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Recomendações */}
          {result.analysis.recommendations.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', color: '#ccff00', mb: 1 }}>
                Recomendações
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#e2e8f0', fontSize: '0.8rem' }}>
                {result.analysis.recommendations.map((r, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{r}</li>
                ))}
              </ul>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2, color: '#64748b' }}>
            <InfoOutlined sx={{ fontSize: 16, mt: 0.2 }} />
            <Typography sx={{ fontSize: '0.7rem' }}>
              Avaliação baseada em boas práticas de ATS — não é garantia de passar em nenhum sistema específico.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
