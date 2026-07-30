'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ScoreRing } from './score-ring';

interface JobInfo {
  id: string;
  empresa: string;
  titulo: string;
  score: number;
}

interface Props {
  job: JobInfo | null;
  session: boolean;
  onClose: () => void;
  onSnackbar: (message: string, severity: 'success' | 'error' | 'info') => void;
}

export function MatchDialog({ job, session, onClose, onSnackbar }: Props) {
  const [adapting, setAdapting] = useState(false);
  const [adaptedResume, setAdaptedResume] = useState<string | null>(null);

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

  function handleClose() {
    setAdaptedResume(null);
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
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" size="small" onClick={handleAdapt} disabled={adapting} sx={{ mt: 1 }}>
                  {adapting ? 'ADAPTANDO...' : 'ADAPTAR CURRÍCULO'}
                </Button>

                {adaptedResume && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
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
