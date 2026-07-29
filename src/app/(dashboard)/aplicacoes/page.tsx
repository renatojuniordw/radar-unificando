'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, Skeleton, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { getStageLabel, getStageGroups, getAllowedTransitions, type Stage } from '@/lib/core/application/state-machine';
import { useSnackbar } from '@/hooks/useSnackbar';

interface Application {
  id: string;
  jobId: string;
  stage: Stage;
  notes: string;
  createdAt: string;
  job?: { empresa: string; tituloVaga: string; plataforma: string; link: string };
}

function DraggableCard({ app, stage }: { app: Application; stage: Stage }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id, data: { app, stage } });

  const style: React.CSSProperties = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  } : {};

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      {...listeners}
      {...attributes}
      sx={{ p: 1, mb: 1, bgcolor: '#020617', color: 'white', cursor: 'grab', ...style }}
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
          onClick={e => e.stopPropagation()}
          onChange={() => {}}
          sx={{ color: '#ccff00', fontSize: 10, height: 24, '& .MuiSelect-select': { py: 0 } }}
        >
          {getAllowedTransitions(stage).map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>
              {getStageLabel(s)}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Paper>
  );
}

function DroppableColumn({ stage, apps, label }: { stage: Stage; apps: Application[]; label: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        p: 1.5, mb: 1, minHeight: 80,
        bgcolor: isOver ? 'action.hover' : apps.length > 0 ? 'background.paper' : 'grey.50',
        transition: 'background-color 0.2s',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.secondary' }}>
        {label}
        <Chip label={apps.length} size="small" sx={{ ml: 1, height: 18, fontSize: 10 }} />
      </Typography>
      {apps.map(app => (
        <DraggableCard key={app.id} app={app} stage={stage} />
      ))}
    </Paper>
  );
}

export default function AplicacoesPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const { show: showSnackbar } = useSnackbar();
  const stageGroups = getStageGroups();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { loadApps(); }, []);

  async function loadApps() {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      setApps(Array.isArray(data) ? data : []);
    } catch {
      showSnackbar('Erro ao carregar candidaturas', 'error');
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
        showSnackbar('Candidatura adicionada!', 'success');
      }
    } catch {
      showSnackbar('Erro ao adicionar', 'error');
    }
  }

  async function handleMove(appId: string, newStage: Stage) {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        loadApps();
        showSnackbar(`Movido para ${getStageLabel(newStage)}`, 'success');
      } else {
        const err = await res.json();
        showSnackbar(err.error || 'Erro ao mover', 'error');
      }
    } catch {
      showSnackbar('Erro ao mover', 'error');
    }
  }

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const app = active.data.current?.app as Application | undefined;
    const newStage = over.id as Stage;
    if (app && newStage && app.stage !== newStage) {
      handleMove(app.id, newStage);
    }
  }, [apps]);

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
          <Typography variant="h4" sx={{ fontWeight: 900 }}>CANDIDATURAS</Typography>
          <Typography variant="body2" color="text.secondary">
            {apps.length} candidaturas em andamento
          </Typography>
        </Box>
        <Button variant="contained" color="warning" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          NOVA
        </Button>
      </Box>

      {apps.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Você ainda não se candidatou a nenhuma vaga. Encontre vagas na página inicial.
          </Typography>
        </Paper>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 2, minHeight: 400 }}>
            {Object.entries(stageGroups).map(([group, stages]) => (
              <Box key={group} sx={{ minWidth: 260, maxWidth: 260 }}>
                <Typography variant="caption" sx={{
                  fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'text.secondary', display: 'block', mb: 1,
                }}>
                  {group}
                </Typography>
                {stages.map(stage => (
                  <DroppableColumn key={stage} stage={stage} apps={getAppsByStage(stage)} label={getStageLabel(stage)} />
                ))}
              </Box>
            ))}
          </Box>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Nova Candidatura</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} placeholder="ID da vaga" sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained">Adicionar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
