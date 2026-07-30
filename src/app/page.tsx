'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Box, Paper, Typography, Button, FormControlLabel, Switch, Snackbar } from '@mui/material';
import { AnonymousStorage } from '@/lib/infrastructure/storage/local-storage';
import { CompanyInput } from '@/components/company-input';
import { PipelineProgress } from '@/components/pipeline-progress';
import { VagaTable } from '@/components/vaga-table';
import { MatchDialog } from '@/components/match-dialog';
import type { JobData } from '@/types';

interface Vaga {
  id?: number;
  empresa: string;
  plataforma: string;
  na_lista: string;
  cargo_categoria: string;
  titulo_vaga: string;
  tipo: string;
  local: string;
  link: string;
  nome_na_plataforma: string;
  publicado: string;
  alerta: string;
  detectado_em: string;
}

interface LogEntry {
  type: string;
  step?: string;
  message?: string;
  error?: string;
  jobs?: JobData[];
}

export default function HomePage() {
  const { data: session } = useSession();
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cargos, setCargos] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedJob, setSelectedJob] = useState<{ id: string; empresa: string; titulo: string; score: number } | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!session && vagas.length === 0) {
      const stored = AnonymousStorage.getVagas();
      if (stored.length > 0) setVagas(stored as Vaga[]);
    }
  }, [session]);

  async function carregarVagas(filters?: { plataforma?: string; cargo?: string; search?: string }) {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters?.plataforma) params.set('plataforma', filters.plataforma);
    if (filters?.cargo) params.set('cargo', filters.cargo);
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString();
    const res = await fetch(`/api/vagas${query ? '?' + query : ''}`);
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : [];
    setVagas(jobs);

    if (!session && jobs.length > 0) AnonymousStorage.setVagas(jobs);

    const uniqueCargos = [...new Set(jobs.map((j: Vaga) => j.cargo_categoria).filter(Boolean))] as string[];
    setCargos(uniqueCargos);
    setLoading(false);

    if (session && jobs.length > 0) {
      fetch('/api/match').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, number> = {};
          for (const m of data) map[String(m.jobId)] = m.score;
          setScores(map);
        }
      }).catch(() => {});
    }
  }

  async function handleStart() {
    setRunning(true);
    setVagas([]);
    setLogs([]);
    setExpanded(true);
    if (!session) AnonymousStorage.clear();

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: empresas, discoveryEnabled }),
      });

      if (!res.ok) {
        setLogs(prev => [...prev, { type: 'pipeline_error', message: 'Erro ao iniciar pipeline' }]);
        setRunning(false);
        return;
      }

      const { runId: id } = await res.json();
      const evtSource = new EventSource(`/api/pipeline/stream?runId=${id}`);

      evtSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as LogEntry;
          setLogs(prev => [...prev, data]);

          if (data.type === 'pipeline_complete' || data.type === 'pipeline_error' || data.type === 'pipeline_cancelled') {
            evtSource.close();
            setRunning(false);

            if (!session && data.type === 'pipeline_complete' && Array.isArray(data.jobs)) {
              const jobs: Vaga[] = data.jobs.map(j => ({ ...j, detectado_em: j.detectado_em || '' }));
              setVagas(jobs);
              AnonymousStorage.setVagas(data.jobs);
              const uniqueCargos = [...new Set(jobs.map(j => j.cargo_categoria).filter(Boolean))];
              setCargos(uniqueCargos);
            } else {
              carregarVagas();
            }

            setSnackbar({
              message: data.message || 'Pipeline concluído!',
              severity: data.type === 'pipeline_complete' ? 'success' : 'error',
            });
          }
        } catch { /* ignore */ }
      };

      evtSource.onerror = () => {
        evtSource.close();
        setRunning(false);
        carregarVagas();
      };
    } catch (error) {
      setLogs(prev => [...prev, { type: 'pipeline_error', message: `Erro: ${error instanceof Error ? error.message : 'desconhecido'}` }]);
      setRunning(false);
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 2 }}>
          RADAR DE VAGAS
        </Typography>

        <CompanyInput value={empresas} onChange={setEmpresas} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={<Switch checked={discoveryEnabled} onChange={e => setDiscoveryEnabled(e.target.checked)} color="warning" />}
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Descobrir novas empresas</Typography>
                <Typography variant="caption" color="text.secondary">Wayback + urlscan + CommonCrawl</Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained" color="warning" size="large"
            onClick={handleStart} disabled={running}
            sx={{ px: 4, py: 1.5, fontWeight: 900, letterSpacing: '0.05em' }}
          >
            {running ? 'BUSCANDO...' : 'EXECUTAR BUSCA'}
          </Button>
        </Box>
      </Paper>

      <PipelineProgress
        logs={logs}
        running={running}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />

      <VagaTable
        vagas={vagas}
        loading={loading}
        cargos={cargos}
        scores={scores}
        session={session}
        onJobClick={setSelectedJob}
        onExportCsv={() => window.open('/export?format=csv', '_blank')}
        onFilterChange={carregarVagas}
      />

      {snackbar && (
        <Snackbar
          open autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      )}

      <MatchDialog
        job={selectedJob}
        session={!!session}
        onClose={() => setSelectedJob(null)}
        onSnackbar={(message, severity) => setSnackbar({ message, severity })}
      />
    </Container>
  );
}
