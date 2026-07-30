'use client';

import { useState } from 'react';
import type { Session } from 'next-auth';
import {
  Box, Typography, TextField, Button, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Select, MenuItem,
  InputAdornment, TablePagination, Skeleton, Autocomplete,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { ScoreRing } from './score-ring';

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

interface JobInfo {
  id: string;
  empresa: string;
  titulo: string;
  score: number;
}

interface Props {
  vagas: Vaga[];
  loading: boolean;
  cargos: string[];
  scores: Record<string, number>;
  session: Session | null;
  onJobClick: (job: JobInfo) => void;
  onExportCsv: () => void;
  onFilterChange: (filters: { plataforma?: string; cargo?: string; search?: string }) => void;
}

export function VagaTable({ vagas, loading, cargos, scores, session, onJobClick, onExportCsv, onFilterChange }: Props) {
  const [filtroPlataforma, setFiltroPlataforma] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const empresas = [...new Set(vagas.map(v => v.empresa).filter(Boolean))].sort();
  const modalidades = [...new Set(vagas.map(v => normalizarModalidade(v.tipo)).filter(Boolean))].sort();

  function normalizarModalidade(tipo: string | undefined | null): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('remote') || t.includes('remoto')) return 'Remota';
    if (t.includes('hybrid') || t.includes('hibrido') || t.includes('híbrido')) return 'Híbrida';
    if (t.includes('on-site') || t.includes('presencial') || t === 'on-site') return 'Presencial';
    return tipo || '';
  }

  const vagasFiltradas = vagas.filter(v => {
    if (filtroEmpresa && v.empresa !== filtroEmpresa) return false;
    if (filtroModalidade && normalizarModalidade(v.tipo) !== filtroModalidade) return false;
    return true;
  });

  function handleFilterChange(updates: { plataforma?: string; cargo?: string }) {
    const plataforma = updates.plataforma ?? filtroPlataforma;
    const cargo = updates.cargo ?? filtroCargo;
    onFilterChange({
      plataforma: plataforma || undefined,
      cargo: cargo || undefined,
      search: filtroBusca || undefined,
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    onFilterChange({
      plataforma: filtroPlataforma || undefined,
      cargo: filtroCargo || undefined,
      search: filtroBusca || undefined,
    });
  }

  const paginatedVagas = vagasFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          {vagasFiltradas.length} VAGAS ENCONTRADAS
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Select
            value={filtroPlataforma}
            onChange={e => { setFiltroPlataforma(e.target.value); handleFilterChange({ plataforma: e.target.value }); }}
            displayEmpty size="small" sx={{ minWidth: 120 }}
          >
            <MenuItem value="">TODAS</MenuItem>
            <MenuItem value="Gupy">GUPY</MenuItem>
            <MenuItem value="InHire">INHIRE</MenuItem>
          </Select>

          <Autocomplete
            options={empresas}
            value={filtroEmpresa || null}
            onChange={(_, v) => { setFiltroEmpresa(v || ''); setPage(0); }}
            renderInput={(params) => (
              <TextField {...params} placeholder="TODAS EMPRESAS" size="small" />
            )}
            size="small" sx={{ minWidth: 180 }}
            noOptionsText="Nenhuma"
            disableClearable={false}
          />

          <Autocomplete
            options={modalidades}
            value={filtroModalidade || null}
            onChange={(_, v) => { setFiltroModalidade(v || ''); setPage(0); }}
            renderInput={(params) => (
              <TextField {...params} placeholder="TODAS MODALIDADES" size="small" />
            )}
            size="small" sx={{ minWidth: 160 }}
            noOptionsText="Nenhuma"
            disableClearable={false}
          />

          <Autocomplete
            options={cargos}
            value={filtroCargo || null}
            onChange={(_, v) => { setFiltroCargo(v || ''); handleFilterChange({ cargo: v || '' }); }}
            renderInput={(params) => (
              <TextField {...params} placeholder="TODOS CARGOS" size="small" />
            )}
            size="small" sx={{ minWidth: 180 }}
            noOptionsText="Nenhuma"
            disableClearable={false}
          />

          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 0 }}>
            <TextField
              size="small" value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)}
              placeholder="Buscar..."
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ width: 180 }}
            />
            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: '0 4px 4px 0' }}>
              IR
            </Button>
          </Box>

          <Button
            variant="outlined" size="small"
            onClick={onExportCsv} disabled={vagas.length === 0}
            startIcon={<FileDownloadIcon />}
          >
            CSV
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4, 5].map(i => (<Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 0.5 }} />))}
        </Box>
      ) : vagasFiltradas.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 1 }}>
          Nenhuma vaga encontrada{filtroEmpresa || filtroModalidade ? ' com esse filtro' : ''}. Execute o pipeline para buscar vagas.
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
                {paginatedVagas.map((vaga, i) => {
                  const vagaId = vaga.id;
                  const score = vagaId ? scores[String(vagaId)] : undefined;
                  return (
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
                          label={vaga.plataforma} size="small" variant="outlined"
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
                        <Button href={vaga.link} target="_blank" size="small" variant="contained"
                          sx={{ fontSize: 10, fontWeight: 700, py: 0.25, px: 1 }}>
                          VER
                        </Button>
                      </TableCell>
                      {session && (
                        <TableCell>
                          {score ? (
                            <Box
                              onClick={() => onJobClick({ id: String(vagaId), empresa: vaga.empresa, titulo: vaga.titulo_vaga, score })}
                              sx={{ cursor: 'pointer', display: 'inline-flex' }}
                            >
                              <ScoreRing score={score} size={28} thickness={3} />
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div" count={vagasFiltradas.length} page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Por página:"
          />
        </>
      )}
    </Paper>
  );
}
