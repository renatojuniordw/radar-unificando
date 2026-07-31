'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Chip, Divider,
} from '@mui/material';
import { ScoreRing } from './score-ring';
import { SkillPill } from './skill-pill';

interface JobInfo {
  id: string;
  empresa: string;
  titulo: string;
  score: number;
}

interface Analysis {
  matchedSkills: string[];
  missingSkills: string[];
  experienceFit: 'above' | 'aligned' | 'below' | null;
  experienceNotes: string;
  seniorityFit: 'above' | 'aligned' | 'below' | null;
  educationFit: 'aligned' | 'partial' | 'misaligned' | null;
  overallFit: 'high' | 'medium' | 'low';
  summary: string;
  recommendations: string[];
}

interface Props {
  job: JobInfo | null;
  session: boolean;
  onClose: () => void;
  onSnackbar: (message: string, severity: 'success' | 'error' | 'info') => void;
}

const fitLabels: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  high: { label: 'Alto', color: 'success' },
  medium: { label: 'Médio', color: 'warning' },
  low: { label: 'Baixo', color: 'error' },
};

const fitLevelLabels: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' }> = {
  aligned: { label: 'Alinhado', color: 'success' },
  above: { label: 'Acima do necessário', color: 'info' },
  below: { label: 'Abaixo do necessário', color: 'error' },
  partial: { label: 'Parcial', color: 'warning' },
  misaligned: { label: 'Desalinhado', color: 'error' },
};

function FitChip({ value, map }: { value: string | null; map: Record<string, { label: string; color: any }> }) {
  if (!value || !map[value]) return null;
  const config = map[value] as { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' };
  return <Chip label={config.label} color={config.color as any} size="small" sx={{ fontWeight: 700 }} />;
}

export function MatchDialog({ job, session, onClose, onSnackbar }: Props) {
  const [adapting, setAdapting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [adaptedResume, setAdaptedResume] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisError, setAnalysisError] = useState(false);

  async function handleAdapt() {
    if (!job?.id) return;
    setAdapting(true);
    try {
      const res = await fetch('/api/resume/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdaptedResume(data.adaptedResume);
      } else {
        onSnackbar('Erro ao adaptar currículo', 'error');
      }
    } catch {
      onSnackbar('Erro ao adaptar currículo', 'error');
    }
    setAdapting(false);
  }

  async function handleAnalyze() {
    if (!job?.id) return;
    setAnalyzing(true);
    setAnalysisError(false);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      } else {
        setAnalysisError(true);
        onSnackbar('Erro ao analisar vaga', 'error');
      }
    } catch {
      setAnalysisError(true);
      onSnackbar('Erro ao analisar vaga', 'error');
    }
    setAnalyzing(false);
  }

  function handleClose() {
    setAdaptedResume(null);
    setAnalysis(null);
    setAnalysisError(false);
    onClose();
  }

  return (
    <Dialog open={!!job} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalhes do Match</DialogTitle>
      <DialogContent>
        {job && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{job.empresa}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{job.titulo}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ScoreRing score={job.score} size={60} />
              <Typography variant="h4" sx={{ fontWeight: 900 }}>{job.score}%</Typography>
            </Box>

            {session && job.id && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                  >
                    {analyzing ? 'ANALISANDO...' : 'ANALISAR PERFIL'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAdapt}
                    disabled={adapting}
                  >
                    {adapting ? 'ADAPTANDO...' : 'ADAPTAR CURRÍCULO'}
                  </Button>
                </Box>

                {analysisError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Não foi possível analisar a vaga. Tente novamente.
                  </Alert>
                )}

                {analysis && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>FIT GERAL</Typography>
                      <FitChip value={analysis.overallFit} map={fitLabels} />
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Skills que batem
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {analysis.matchedSkills.map(s => (
                        <SkillPill key={s} label={s} matchType="matched" />
                      ))}
                      {analysis.matchedSkills.length === 0 && (
                        <Typography variant="caption" color="text.secondary">Nenhuma</Typography>
                      )}
                    </Box>

                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Skills que faltam
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {analysis.missingSkills.map(s => (
                        <SkillPill key={s} label={s} matchType="missing" />
                      ))}
                      {analysis.missingSkills.length === 0 && (
                        <Typography variant="caption" color="text.secondary">Nenhuma</Typography>
                      )}
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Experiência</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FitChip value={analysis.experienceFit} map={fitLevelLabels} />
                        </Box>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {analysis.experienceNotes}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Senioridade</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FitChip value={analysis.seniorityFit} map={fitLevelLabels} />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Formação</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FitChip value={analysis.educationFit} map={fitLevelLabels} />
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {analysis.summary}
                    </Typography>

                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Recomendações
                    </Typography>
                    {analysis.recommendations.map((r, i) => (
                      <Typography key={i} variant="caption" display="block" sx={{ mb: 0.25 }}>
                        • {r}
                      </Typography>
                    ))}
                  </Paper>
                )}

                {adaptedResume && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                      CURRÍCULO ADAPTADO
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {adaptedResume}
                    </Typography>
                    <Button size="small" sx={{ mt: 1 }} onClick={() => {
                      navigator.clipboard.writeText(adaptedResume);
                      onSnackbar('Copiado!', 'success');
                    }}>
                      COPIAR
                    </Button>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
