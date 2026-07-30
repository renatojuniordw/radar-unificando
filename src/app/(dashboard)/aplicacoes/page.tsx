'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem,
} from '@mui/material';
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
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: 8, marginBottom: 8,
        backgroundColor: '#020617', color: 'white',
        cursor: 'grab', border: '2px solid #020617',
        boxShadow: '4px 4px 0px #000',
        ...style,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {app.job?.empresa || 'Empresa'}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.55rem', marginTop: 2 }}>
        {app.job?.tituloVaga || 'Vaga'}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <Select
          size="small"
          value={stage}
          onClick={e => e.stopPropagation()}
          onChange={() => {}}
          sx={{ color: '#ccff00', fontSize: 10, height: 24, '& .MuiSelect-select': { py: 0 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
        >
          {getAllowedTransitions(stage).map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>
              {getStageLabel(s)}
            </MenuItem>
          ))}
        </Select>
      </div>
    </div>
  );
}

function DroppableColumn({ stage, apps, label }: { stage: Stage; apps: Application[]; label: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: 12, marginBottom: 8, minHeight: 80,
        border: '4px solid #020617',
        backgroundColor: isOver ? '#f1f5f9' : '#ffffff',
        transition: 'background-color 0.2s',
        boxShadow: '4px 4px 0px #000',
      }}
    >
      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {label}
        <span style={{ border: '2px solid #020617', padding: '0 6px', fontSize: '0.5rem' }}>{apps.length}</span>
      </div>
      {apps.map(app => (
        <DraggableCard key={app.id} app={app} stage={stage} />
      ))}
    </div>
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
        <div style={{ height: 400, border: '4px solid #e2e8f0', background: '#f1f5f9' }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            CANDIDATURAS
          </Typography>
          <Typography sx={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {apps.length} candidaturas em andamento
          </Typography>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="btn-neon"
          style={{ padding: '10px 20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          + NOVA
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="card-brutalist" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Você ainda não se candidatou a nenhuma vaga. Encontre vagas na página inicial.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 16, overflow: 'auto', paddingBottom: 16, minHeight: 400 }}>
            {Object.entries(stageGroups).map(([group, stages]) => (
              <div key={group} style={{ minWidth: 260, maxWidth: 260 }}>
                <div style={{
                  fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: '#64748b', marginBottom: 8, fontFamily: 'ui-monospace, monospace', fontSize: '0.6rem',
                }}>
                  {group}
                </div>
                {stages.map(stage => (
                  <DroppableColumn key={stage} stage={stage} apps={getAppsByStage(stage)} label={getStageLabel(stage)} />
                ))}
              </div>
            ))}
          </div>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <div className="card-brutalist" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '2px solid #020617' }}>
            <h3 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem', margin: 0 }}>Nova Candidatura</h3>
          </div>
          <div style={{ padding: 16 }}>
            <label style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
              ID da vaga
            </label>
            <input
              type="text"
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              placeholder="ID da vaga"
              style={{
                width: '100%',
                border: '4px solid #020617',
                padding: '10px 12px',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                boxShadow: '4px 4px 0px #000',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 16, borderTop: '2px solid #f1f5f9' }}>
            <button
              onClick={() => setDialogOpen(false)}
              style={{
                border: '2px solid #020617', background: 'none', fontWeight: 900,
                padding: '8px 16px', cursor: 'pointer', fontSize: '0.65rem',
                textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="btn-neon"
              style={{ padding: '8px 16px', fontSize: '0.65rem' }}
            >
              Adicionar
            </button>
          </div>
        </div>
      </Dialog>
    </Container>
  );
}
