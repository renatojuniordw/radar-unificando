'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Container, Typography, Box, TextField, Button, Accordion, AccordionSummary,
  AccordionDetails, LinearProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Select, MenuItem,
  InputAdornment, FormControlLabel, Switch, Snackbar, TablePagination, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { AnonymousStorage } from '@/lib/infrastructure/storage/local-storage';

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
}

export default function HomePage() {
  const { data: session } = useSession();
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [empresaInput, setEmpresaInput] = useState('');
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Filters
  const [filtroPlataforma, setFiltroPlataforma] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [cargos, setCargos] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Scores + breakdown
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedJob, setSelectedJob] = useState<{ id?: string; empresa: string; titulo: string; score: number; evidence: string[] } | null>(null);
  const [adapting, setAdapting] = useState(false);
  const [adaptedResume, setAdaptedResume] = useState<string | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session && vagas.length === 0) {
      const stored = AnonymousStorage.getVagas();
      if (stored.length > 0) setVagas(stored as Vaga[]);
    }
  }, [session]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function addLog(entry: LogEntry) {
    setLogs(prev => [...prev, entry]);
  }

  function addEmpresa(value: string) {
    const trimmed = value.trim();
    if (trimmed && !empresas.includes(trimmed)) {
      setEmpresas(prev => [...prev, trimmed]);
    }
  }

  function removeEmpresa(value: string) {
    setEmpresas(prev => prev.filter(e => e !== value));
  }

  function handleEmpresaKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const parts = empresaInput.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(addEmpresa);
      setEmpresaInput('');
    }
    if (e.key === 'Backspace' && empresaInput === '' && empresas.length > 0) {
      setEmpresas(prev => prev.slice(0, -1));
    }
  }

  async function handleStart() {
    setRunning(true);
    setVagas([]);
    setLogs([]);
    setExpanded(true);
    addLog({ type: 'step_start', message: 'Iniciando pipeline...' });

    if (!session) AnonymousStorage.clear();

    try {
      const companies = empresas;

      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies, discoveryEnabled }),
      });

      if (!res.ok) {
        addLog({ type: 'pipeline_error', message: 'Erro ao iniciar pipeline' });
        setRunning(false);
        return;
      }

      const { runId: id } = await res.json();
      setRunId(id);

      const evtSource = new EventSource(`/api/pipeline/stream?runId=${id}`);

      evtSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as LogEntry;
          addLog(data);

          if (data.type === 'pipeline_complete' || data.type === 'pipeline_error' || data.type === 'pipeline_cancelled') {
            evtSource.close();
            setRunning(false);
            carregarVagas();
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
      addLog({ type: 'pipeline_error', message: `Erro: ${error instanceof Error ? error.message : 'desconhecido'}` });
      setRunning(false);
    }
  }

  async function carregarVagas() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroPlataforma) params.set('plataforma', filtroPlataforma);
    if (filtroCargo) params.set('cargo', filtroCargo);
    if (filtroBusca) params.set('search', filtroBusca);

    const query = params.toString();
    const res = await fetch(`/api/vagas${query ? '?' + query : ''}`);
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : [];
    setVagas(jobs);

    if (!session && jobs.length > 0) {
      AnonymousStorage.setVagas(jobs);
    }

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

  useEffect(() => {
    if (vagas.length > 0 || !running) {
      carregarVagas();
    }
  }, [filtroPlataforma, filtroCargo]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    carregarVagas();
  }

  function exportCsv() {
    window.open('/export?format=csv', '_blank');
    setSnackbar({ message: 'CSV exportado!', severity: 'success' });
  }

  const paginatedVagas = vagas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  function getLogColor(type: string): React.CSSProperties {
    switch (type) {
      case 'step_start': return { color: '#ccff00' };
      case 'step_progress': return { color: '#94a3b8' };
      case 'step_complete': return { color: '#16a34a' };
      case 'step_warn': return { color: '#ffaa00' };
      case 'step_error': return { color: '#dc2626' };
      case 'pipeline_complete': return { color: '#16a34a', fontWeight: '700' };
      case 'pipeline_error': return { color: '#dc2626', fontWeight: '700' };
      case 'pipeline_cancelled': return { color: '#ffaa00', fontWeight: '700' };
      default: return {};
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Input Section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 2 }}>
          RADAR DE VAGAS
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Empresas que você quer monitorar (opcional). Deixe vazio para buscar todas.
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
          Digite o nome e pressione <b>Enter</b> ou <b>vírgula</b> para adicionar.{' '}
          Clique no <b>×</b> para remover. <b>Backspace</b> no campo vazio apaga o último.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            minHeight: 56,
            alignItems: 'center',
            mb: 2,
            bgcolor: 'background.paper',
          }}
        >
          {empresas.map(emp => (
            <Chip
              key={emp}
              label={emp}
              onDelete={() => removeEmpresa(emp)}
              size="small"
              variant="outlined"
              color="warning"
              sx={{ fontWeight: 700, fontSize: 11 }}
            />
          ))}
          <input
            value={empresaInput}
            onChange={e => setEmpresaInput(e.target.value)}
            onKeyDown={handleEmpresaKeyDown}
            onBlur={() => {
              if (empresaInput.trim()) {
                addEmpresa(empresaInput);
                setEmpresaInput('');
              }
            }}
            placeholder={empresas.length === 0 ? "Ambev, Nubank, BRQ..." : ""}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              minWidth: 120,
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              padding: '4px 0',
              background: 'transparent',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                checked={discoveryEnabled}
                onChange={e => setDiscoveryEnabled(e.target.checked)}
                color="warning"
              />
            }
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
            variant="contained"
            color="warning"
            size="large"
            onClick={handleStart}
            disabled={running}
            sx={{ px: 4, py: 1.5, fontWeight: 900, letterSpacing: '0.05em' }}
          >
            {running ? 'BUSCANDO...' : 'EXECUTAR BUSCA'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={exportCsv}
            disabled={vagas.length === 0}
            startIcon={<FileDownloadIcon />}
          >
            EXPORTAR CSV
          </Button>
        </Box>
      </Paper>

      {/* Progress Accordion */}
      <Accordion
        expanded={expanded}
        onChange={(_, isExpanded) => setExpanded(isExpanded)}
        sx={{ mb: 3 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            PROGRESSO {running && <LinearProgress sx={{ mt: 1, width: 200, display: 'inline-block', ml: 2 }} />}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              maxHeight: 300,
              overflow: 'auto',
              bgcolor: '#020617',
              color: '#e2e8f0',
              p: 2,
              borderRadius: 1,
            }}
          >
            {logs.length === 0 && !running && (
              <Typography variant="caption" color="grey.600">
                Aguardando execução...
              </Typography>
            )}
            {logs.map((log, i) => (
              <Box key={i} sx={getLogColor(log.type)}>
                <Typography variant="caption" component="span" sx={{ color: '#475569' }}>
                  [{log.step || '-'}]
                </Typography>{' '}
                <Typography variant="caption" component="span">
                  {log.message}
                </Typography>
              </Box>
            ))}
            {running && (
              <Typography variant="caption" sx={{ color: '#475569', animation: 'pulse 1s infinite' }}>
                Processando...
              </Typography>
            )}
            <div ref={logEndRef} />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Results */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {vagas.length} VAGAS ENCONTRADAS
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Select
              value={filtroPlataforma}
              onChange={e => setFiltroPlataforma(e.target.value)}
              displayEmpty
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">TODAS</MenuItem>
              <MenuItem value="Gupy">GUPY</MenuItem>
              <MenuItem value="InHire">INHIRE</MenuItem>
            </Select>

            <Select
              value={filtroCargo}
              onChange={e => setFiltroCargo(e.target.value)}
              displayEmpty
              size="small"
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">TODOS CARGOS</MenuItem>
              {cargos.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>

            <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 0 }}>
              <TextField
                size="small"
                value={filtroBusca}
                onChange={e => setFiltroBusca(e.target.value)}
                placeholder="Buscar..."
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{ width: 180 }}
              />
              <Button type="submit" variant="contained" size="small" sx={{ borderRadius: '0 4px 4px 0' }}>
                IR
              </Button>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 0.5 }} />
            ))}
          </Box>
        ) : vagas.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            Nenhuma vaga encontrada. Execute o pipeline para buscar vagas.
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#020617' }}>
                    <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>EMPRESA</TableCell>
                    <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>PLAT</TableCell>
                    <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>CARGO</TableCell>
                    <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>TÍTULO</TableCell>
                    <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>LOCAL</TableCell>
                    <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>LINK</TableCell>
                    {session && <TableCell sx={{ color: '#ccff00', fontWeight: 700 }}>SCORE</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedVagas.map((vaga, i) => (
                    <TableRow
                      key={`${vaga.link}-${i}`}
                      hover
                      sx={{
                        bgcolor: vaga.na_lista === 'Sim' ? 'rgba(204, 255, 0, 0.05)' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {vaga.na_lista === 'Sim' && (
                            <Chip label="LISTA" size="small" sx={{
                              bgcolor: '#020617', color: '#ccff00', fontWeight: 900, fontSize: 10,
                              height: 20, borderRadius: 0.5, '& .MuiChip-label': { px: 0.5 },
                            }} />
                          )}
                          {vaga.empresa}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vaga.plataforma}
                          size="small"
                          variant="outlined"
                          color={vaga.plataforma === 'Gupy' ? 'warning' : 'default'}
                          sx={{ fontWeight: 700, fontSize: 11 }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 9 }}>
                          {vaga.nome_na_plataforma}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{vaga.cargo_categoria}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{vaga.titulo_vaga}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{vaga.local}</TableCell>
                      <TableCell>
                        <Button
                          href={vaga.link}
                          target="_blank"
                          size="small"
                          variant="contained"
                          sx={{ fontSize: 10, fontWeight: 700, py: 0.25, px: 1 }}
                        >
                          VER
                        </Button>
                      </TableCell>
                      {session && (
                        <TableCell>
                          {(() => {
                            const vagaId = vaga.id;
                            const score = vagaId ? scores[String(vagaId)] : undefined;
                            return (
                              <Box
                                onClick={() => score && setSelectedJob({
                                  id: String(vagaId),
                                  empresa: vaga.empresa,
                                  titulo: vaga.titulo_vaga,
                                  score,
                                  evidence: [],
                                })}
                                sx={{ cursor: score ? 'pointer' : 'default' }}
                              >
                                {score ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CircularProgress
                                      variant="determinate"
                                      value={score}
                                      size={28}
                                      sx={{ color: score >= 70 ? '#16a34a' : score >= 40 ? '#ffaa00' : '#dc2626' }}
                                    />
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                      {score}%
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">—</Typography>
                                )}
                              </Box>
                            );
                          })()}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={vagas.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Por página:"
            />
          </>
        )}
      </Paper>

      {snackbar && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      )}

      <Dialog open={!!selectedJob} onClose={() => setSelectedJob(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes do Match</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedJob.empresa}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedJob.titulo}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={selectedJob.score}
                  size={60}
                  sx={{ color: selectedJob.score >= 70 ? '#16a34a' : selectedJob.score >= 40 ? '#ffaa00' : '#dc2626' }}
                />
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{selectedJob.score}%</Typography>
              </Box>

              {session && selectedJob.id && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      setAdapting(true);
                      try {
                        const res = await fetch('/api/resume/adapt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ jobId: selectedJob.id }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setAdaptedResume(data.adaptedResume);
                        } else {
                          setSnackbar({ message: 'Erro ao adaptar currículo', severity: 'error' });
                        }
                      } catch {
                        setSnackbar({ message: 'Erro ao adaptar currículo', severity: 'error' });
                      }
                      setAdapting(false);
                    }}
                    disabled={adapting}
                    sx={{ mt: 1 }}
                  >
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
                      <Button
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => {
                          navigator.clipboard.writeText(adaptedResume);
                          setSnackbar({ message: 'Copiado!', severity: 'success' });
                        }}
                      >
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
          <Button onClick={() => { setSelectedJob(null); setAdaptedResume(null); }}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
