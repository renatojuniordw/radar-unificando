'use client';

import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Button, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Chip, Skeleton, Snackbar, Select,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { getStageLabel, getStageGroups, getAllowedTransitions, type Stage, STAGES } from '@/lib/core/application/state-machine';

interface Application {
  id: string;
  jobId: string;
  stage: Stage;
  notes: string;
  createdAt: string;
  job?: {
    empresa: string;
    tituloVaga: string;
    plataforma: string;
    link: string;
  };
}

export default function AplicacoesPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const stageGroups = getStageGroups();

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      setApps(Array.isArray(data) ? data : []);
    } catch {
      setSnackbar({ message: 'Erro ao carregar candidaturas', severity: 'error' });
    }
    setLoading(false);
  }

  async function handleCreate() {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId }),
      });

      if (res.ok) {
        loadApps();
        setDialogOpen(false);
        setSnackbar({ message: 'Candidatura adicionada!', severity: 'success' });
      }
    } catch {
      setSnackbar({ message: 'Erro ao adicionar', severity: 'error' });
    }
  }

  async function handleMove(app: Application, newStage: Stage) {
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (res.ok) {
        loadApps();
        setSnackbar({ message: `Movido para ${getStageLabel(newStage)}`, severity: 'success' });
      } else {
        const err = await res.json();
        setSnackbar({ message: err.error || 'Erro ao mover', severity: 'error' });
      }
    } catch {
      setSnackbar({ message: 'Erro ao mover', severity: 'error' });
    }
  }

  function getAppsByStage(stage: Stage) {
    return apps.filter(a => a.stage === stage);
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            CANDIDATURAS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {apps.length} candidaturas em andamento
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="warning"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          NOVA
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 2, minHeight: 400 }}>
        {Object.entries(stageGroups).map(([group, stages]) => (
          <Box key={group} sx={{ minWidth: 260, maxWidth: 260 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'text.secondary',
                display: 'block',
                mb: 1,
              }}
            >
              {group}
            </Typography>

            {stages.map(stage => {
              const columnApps = getAppsByStage(stage);
              return (
                <Paper
                  key={stage}
                  variant="outlined"
                  sx={{ p: 1.5, mb: 1, bgcolor: columnApps.length > 0 ? 'background.paper' : 'grey.50' }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.secondary' }}>
                    {getStageLabel(stage)}
                    <Chip label={columnApps.length} size="small" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                  </Typography>

                  {columnApps.map(app => (
                    <Paper
                      key={app.id}
                      variant="outlined"
                      sx={{ p: 1, mb: 1, bgcolor: '#020617', color: 'white' }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                        {app.job?.empresa || 'Empresa'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: 10 }}>
                        {app.job?.tituloVaga || 'Vaga'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                        <Select
                          size="small"
                          value={stage}
                          onChange={e => handleMove(app, e.target.value as Stage)}
                          sx={{
                            color: '#ccff00',
                            fontSize: 10,
                            height: 24,
                            '& .MuiSelect-select': { py: 0 },
                          }}
                        >
                          {getAllowedTransitions(stage).map(s => (
                            <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>
                              {getStageLabel(s)}
                            </MenuItem>
                          ))}
                        </Select>
                      </Box>
                    </Paper>
                  ))}
                </Paper>
              );
            })}
          </Box>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Nova Candidatura</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Cole o ID da vaga para adicionar aos seus acompanhamentos.
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            placeholder="ID da vaga"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained">Adicionar</Button>
        </DialogActions>
      </Dialog>

      {snackbar && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      )}
    </Container>
  );
}
