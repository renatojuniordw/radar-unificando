'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button,
  Select, MenuItem, InputAdornment, Autocomplete, Skeleton, Drawer, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useDebounce } from 'use-debounce';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JobPostingSchema } from '@/components/seo/job-posting-schema';

const GRID_COLUMNS = '180px 120px 140px 1fr 150px 90px';

interface Vaga {
  id?: number;
  empresa: string;
  plataforma: string;
  na_lista?: string;
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

interface Props {
  vagas: Vaga[];
  loading: boolean;
  cargos: string[];
  onExportCsv: () => void;
  onFilterChange: (filters: { plataforma?: string; cargo?: string; search?: string }) => void;
}

export function VagaTable({ vagas, loading, cargos, onExportCsv, onFilterChange }: Props) {
  const [filtroPlataforma, setFiltroPlataforma] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [debouncedSearch] = useDebounce(filtroBusca, 300);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paginaMobile, setPaginaMobile] = useState(1);
  const ITENS_POR_PAGINA = 10;

  const parentRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // Reset mobile page when filters or search change
  useEffect(() => {
    setPaginaMobile(1);
  }, [filtroPlataforma, filtroCargo, filtroBusca, filtroEmpresa, filtroModalidade]);

  const countSecondaryFilters = [
    filtroPlataforma,
    filtroEmpresa,
    filtroModalidade,
    filtroCargo,
  ].filter(Boolean).length;

  const countTotalFilters = countSecondaryFilters + (filtroBusca ? 1 : 0);

  function handleClearFilters() {
    setFiltroPlataforma('');
    setFiltroEmpresa('');
    setFiltroModalidade('');
    setFiltroCargo('');
    setFiltroBusca('');
    onFilterChange({});
  }

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

  // Trigger search on debounced value
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onFilterChange({
        plataforma: filtroPlataforma || undefined,
        cargo: filtroCargo || undefined,
        search: debouncedSearch || undefined,
      });
    }
  }, [debouncedSearch]);

  const rowVirtualizer = useVirtualizer({
    count: vagasFiltradas.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 8,
  });

  return (
    <>
      <JobPostingSchema
        jobs={vagasFiltradas.map((v) => ({
          title: v.titulo_vaga,
          company: v.empresa,
          location: v.local,
          type: v.tipo,
          url: v.link,
          datePosted: v.detectado_em,
        }))}
      />
      <Box
        className="card-brutalist"
        sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        bgcolor: '#ffffff',
        border: '3px solid #020617',
        boxShadow: { xs: '4px 4px 0px #000', md: '6px 6px 0px #000' },
      }}
    >
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography
            sx={{
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
              color: '#020617',
            }}
          >
            {vagasFiltradas.length} VAGAS ENCONTRADAS
          </Typography>
          <Typography
            sx={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.65rem',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mt: 0.25,
            }}
          >
            Atualizado em tempo real · {vagas.length} vagas no banco
          </Typography>
        </Box>

        {vagas.length > 0 && (
          <button
            onClick={onExportCsv}
            style={{
              border: '2px solid #020617',
              backgroundColor: '#ffffff',
              color: '#020617',
              fontWeight: 900,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: 'ui-monospace, monospace',
              boxShadow: '2px 2px 0px #000',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <DownloadIcon style={{ fontSize: 14 }} />
            EXPORTAR CSV
          </button>
        )}
      </Box>

      {/* MOBILE CONTROLS HEADER (Strictly xs & sm screens <768px) */}
      <Box component="form" onSubmit={handleSearch} sx={{ display: { xs: 'block', md: 'none' }, mb: 2.5 }}>
        {/* Full-width Search Bar */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField
            size="small"
            value={filtroBusca}
            onChange={e => setFiltroBusca(e.target.value)}
            placeholder="Buscar cargo, empresa, termo..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#020617' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: 1,
              bgcolor: '#ffffff',
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                border: '2px solid #020617',
                fontWeight: 700,
                fontSize: '0.85rem',
                fontFamily: 'ui-monospace, monospace',
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{
              borderRadius: 0,
              border: '2px solid #020617',
              bgcolor: '#020617',
              color: '#ccff00',
              boxShadow: '2px 2px 0px #000',
              fontWeight: 900,
              fontFamily: 'ui-monospace, monospace',
              px: 2.5,
              fontSize: '0.85rem',
              '&:hover': {
                bgcolor: '#1e293b',
                color: '#ccff00',
              },
            }}
          >
            IR
          </Button>
        </Box>

        {/* Filter Trigger Pills */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            onClick={() => setDrawerOpen(true)}
            fullWidth
            size="small"
            startIcon={<FilterListIcon fontSize="small" />}
            sx={{
              justifyContent: 'center',
              border: '2px solid #020617',
              bgcolor: countSecondaryFilters > 0 ? '#020617' : '#ffffff',
              color: countSecondaryFilters > 0 ? '#ccff00' : '#020617',
              fontWeight: 900,
              fontSize: '0.75rem',
              fontFamily: 'ui-monospace, monospace',
              borderRadius: 0,
              py: 1,
              px: 2,
              boxShadow: '2px 2px 0px #000',
              '&:hover': {
                bgcolor: countSecondaryFilters > 0 ? '#1e293b' : '#f1f5f9',
              },
            }}
          >
            FILTROS AVANÇADOS {countSecondaryFilters > 0 ? `(${countSecondaryFilters})` : ''}
          </Button>

          {countTotalFilters > 0 && (
            <Button
              onClick={handleClearFilters}
              size="small"
              startIcon={<DeleteOutlineIcon fontSize="small" />}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 1,
                border: '2px solid #020617',
                bgcolor: '#ffffff',
                color: '#ef4444',
                fontWeight: 900,
                fontSize: '0.7rem',
                fontFamily: 'ui-monospace, monospace',
                borderRadius: 0,
                boxShadow: '2px 2px 0px #000',
                whiteSpace: 'nowrap',
              }}
            >
              LIMPAR
            </Button>
          )}
        </Box>
      </Box>

      {/* DESKTOP FILTERS GRID (Strictly md screens and up >=768px) */}
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: '130px 180px 160px 180px 1fr',
          gap: 1.5,
          alignItems: 'center',
          mb: 2.5,
        }}
      >
        <Select
          value={filtroPlataforma}
          onChange={e => { setFiltroPlataforma(e.target.value); handleFilterChange({ plataforma: e.target.value }); }}
          displayEmpty
          size="small"
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: 0,
            border: '2px solid #020617',
            fontSize: '0.75rem',
            fontWeight: 700,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          <MenuItem value="">TODAS PLATS</MenuItem>
          <MenuItem value="Gupy">GUPY</MenuItem>
          <MenuItem value="InHire">INHIRE</MenuItem>
        </Select>

        <Autocomplete
          options={empresas}
          value={filtroEmpresa || null}
          onChange={(_, v) => { setFiltroEmpresa(v || ''); }}
          renderInput={(params) => (
            <TextField {...params} placeholder="TODAS EMPRESAS" size="small" />
          )}
          size="small"
          noOptionsText="Nenhuma"
          disableClearable={false}
        />

        <Autocomplete
          options={modalidades}
          value={filtroModalidade || null}
          onChange={(_, v) => { setFiltroModalidade(v || ''); }}
          renderInput={(params) => (
            <TextField {...params} placeholder="MODALIDADES" size="small" />
          )}
          size="small"
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
          size="small"
          noOptionsText="Nenhuma"
          disableClearable={false}
        />

        <Box sx={{ display: 'flex', gap: 0, width: '100%' }}>
          <TextField
            size="small"
            value={filtroBusca}
            onChange={e => setFiltroBusca(e.target.value)}
            placeholder="Buscar por palavra-chave..."
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            sx={{ flex: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{
              borderRadius: 0,
              border: '2px solid #020617',
              bgcolor: '#020617',
              color: '#ccff00',
              boxShadow: '2px 2px 0px #000',
              fontWeight: 900,
              fontFamily: 'ui-monospace, monospace',
              px: 2.5,
              '&:hover': {
                bgcolor: '#1e293b',
                color: '#ccff00',
              },
            }}
          >
            IR
          </Button>
        </Box>
      </Box>

      {/* MOBILE BOTTOM FILTER DRAWER */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTop: '4px solid #020617',
            bgcolor: '#ffffff',
            p: 2.5,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            maxHeight: '85vh',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: '2px solid #020617' }}>
          <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#020617', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            ⚡ FILTROS AVANÇADOS
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ border: '2px solid #020617', borderRadius: 0, p: 0.5, color: '#020617' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', mb: 0.75, fontFamily: 'ui-monospace, monospace' }}>
              Plataforma
            </Typography>
            <Select
              fullWidth
              value={filtroPlataforma}
              onChange={e => { setFiltroPlataforma(e.target.value); handleFilterChange({ plataforma: e.target.value }); }}
              displayEmpty
              size="small"
              sx={{
                backgroundColor: '#ffffff',
                borderRadius: 0,
                border: '2px solid #020617',
                fontSize: '0.85rem',
                fontWeight: 700,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              <MenuItem value="">TODAS AS PLATAFORMAS</MenuItem>
              <MenuItem value="Gupy">GUPY</MenuItem>
              <MenuItem value="InHire">INHIRE</MenuItem>
            </Select>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', mb: 0.75, fontFamily: 'ui-monospace, monospace' }}>
              Empresa
            </Typography>
            <Autocomplete
              options={empresas}
              value={filtroEmpresa || null}
              onChange={(_, v) => { setFiltroEmpresa(v || ''); }}
              renderInput={(params) => (
                <TextField {...params} placeholder="SELECIONE UMA EMPRESA" size="small" />
              )}
              size="small"
              noOptionsText="Nenhuma empresa encontrada"
              disableClearable={false}
            />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', mb: 0.75, fontFamily: 'ui-monospace, monospace' }}>
              Modalidade
            </Typography>
            <Autocomplete
              options={modalidades}
              value={filtroModalidade || null}
              onChange={(_, v) => { setFiltroModalidade(v || ''); }}
              renderInput={(params) => (
                <TextField {...params} placeholder="SELECIONE A MODALIDADE" size="small" />
              )}
              size="small"
              noOptionsText="Nenhuma opção"
              disableClearable={false}
            />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', mb: 0.75, fontFamily: 'ui-monospace, monospace' }}>
              Cargo
            </Typography>
            <Autocomplete
              options={cargos}
              value={filtroCargo || null}
              onChange={(_, v) => { setFiltroCargo(v || ''); handleFilterChange({ cargo: v || '' }); }}
              renderInput={(params) => (
                <TextField {...params} placeholder="SELECIONE O CARGO" size="small" />
              )}
              size="small"
              noOptionsText="Nenhum cargo encontrado"
              disableClearable={false}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={() => setDrawerOpen(false)}
            fullWidth
            variant="contained"
            sx={{
              borderRadius: 0,
              border: '2px solid #020617',
              bgcolor: '#020617',
              color: '#ccff00',
              boxShadow: '3px 3px 0px #000',
              fontWeight: 900,
              fontFamily: 'ui-monospace, monospace',
              py: 1.25,
              fontSize: '0.85rem',
              '&:hover': {
                bgcolor: '#1e293b',
              },
            }}
          >
            VER {vagasFiltradas.length} VAGAS →
          </Button>

          {countSecondaryFilters > 0 && (
            <Button
              onClick={() => {
                handleClearFilters();
                setDrawerOpen(false);
              }}
              sx={{
                borderRadius: 0,
                border: '2px solid #020617',
                bgcolor: '#ffffff',
                color: '#ef4444',
                boxShadow: '3px 3px 0px #000',
                fontWeight: 900,
                fontFamily: 'ui-monospace, monospace',
                px: 2,
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
            >
              LIMPAR
            </Button>
          )}
        </Box>
      </Drawer>

      {/* RESULTS DISPLAY AREA */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3, 4].map(i => (
            <Box key={i} sx={{ p: 2, border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Skeleton variant="rectangular" width="40%" height={20} />
              <Skeleton variant="rectangular" width="80%" height={24} />
              <Skeleton variant="rectangular" width="60%" height={18} />
            </Box>
          ))}
        </Box>
      ) : vagasFiltradas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, px: 2, color: '#64748b' }}>
          <SearchOffIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.4 }} />
          <Typography sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#020617' }}>
            Nenhuma vaga encontrada
          </Typography>
          <Typography sx={{ mb: 2, maxWidth: 420, mx: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#64748b' }}>
            {vagas.length === 0
              ? 'Preencha os parâmetros e clique em BUSCAR VAGAS para iniciar.'
              : 'Tente limpar os filtros ou buscar por outro termo.'}
          </Typography>
          {countTotalFilters > 0 && (
            <Button
              onClick={handleClearFilters}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 0,
                border: '2px solid #020617',
                color: '#020617',
                fontWeight: 900,
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.75rem',
                boxShadow: '2px 2px 0px #000',
              }}
            >
              REMOVER TODOS OS FILTROS
            </Button>
          )}
        </Box>
      ) : (
        <>
          {/* MOBILE CARDS FEED WITH PAGINATION (xs & sm screens <768px) */}
          <Box ref={mobileContainerRef} sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {vagasFiltradas
              .slice((paginaMobile - 1) * ITENS_POR_PAGINA, paginaMobile * ITENS_POR_PAGINA)
              .map((vaga, index) => (
                <Box
                  key={vaga.id || `${vaga.empresa}-${vaga.titulo_vaga}-${index}`}
                  sx={{
                    bgcolor: '#ffffff',
                    border: '3px solid #020617',
                    boxShadow: '4px 4px 0px #000',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                  }}
                >
                  {/* Header: Company & Platform Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        color: '#020617',
                        textTransform: 'uppercase',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vaga.empresa}
                    </Typography>

                    <Box
                      sx={{
                        border: '2px solid #020617',
                        bgcolor: vaga.plataforma === 'Gupy' ? '#ccff00' : '#e2e8f0',
                        color: '#020617',
                        fontWeight: 900,
                        fontSize: '0.6rem',
                        px: 1,
                        py: 0.25,
                        fontFamily: 'ui-monospace, monospace',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vaga.plataforma}
                    </Box>
                  </Box>

                  {/* Job Title */}
                  <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#020617', lineHeight: 1.25 }}>
                    {vaga.titulo_vaga}
                  </Typography>

                  {/* Metadata Pills */}
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {vaga.cargo_categoria && (
                      <Box sx={{ border: '1px solid #020617', bgcolor: '#f8fafc', px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#334155' }}>
                        {vaga.cargo_categoria}
                      </Box>
                    )}
                    {vaga.tipo && (
                      <Box sx={{ border: '1px solid #020617', bgcolor: '#f8fafc', px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#334155' }}>
                        {vaga.tipo}
                      </Box>
                    )}
                    {vaga.local && (
                      <Box sx={{ border: '1px solid #020617', bgcolor: '#f8fafc', px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#334155' }}>
                        📍 {vaga.local}
                      </Box>
                    )}
                  </Box>

                  {/* Action CTA Button */}
                  <a
                    href={vaga.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', marginTop: 4 }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        textAlign: 'center',
                        bgcolor: '#020617',
                        color: '#ccff00',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        py: 1.25,
                        px: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: 'ui-monospace, monospace',
                        border: '2px solid #020617',
                        boxShadow: '3px 3px 0px #000',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: '#1e293b',
                        },
                      }}
                    >
                      VER VAGA NO {vaga.plataforma.toUpperCase()} →
                    </Box>
                  </a>
                </Box>
              ))}

            {/* Mobile Pagination Navigation Bar */}
            {Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA) > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  pt: 1,
                  pb: 1,
                  gap: 1,
                  borderTop: '2px dashed #cbd5e1',
                  mt: 1,
                }}
              >
                <Button
                  disabled={paginaMobile === 1}
                  onClick={() => {
                    setPaginaMobile(prev => Math.max(prev - 1, 1));
                    mobileContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  size="small"
                  sx={{
                    border: '2px solid #020617',
                    bgcolor: paginaMobile === 1 ? '#e2e8f0' : '#ffffff',
                    color: '#020617',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    fontFamily: 'ui-monospace, monospace',
                    borderRadius: 0,
                    boxShadow: paginaMobile === 1 ? 'none' : '2px 2px 0px #000',
                    px: 1.5,
                    py: 0.75,
                    opacity: paginaMobile === 1 ? 0.5 : 1,
                  }}
                >
                  ← ANTERIOR
                </Button>

                <Typography
                  sx={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    color: '#020617',
                  }}
                >
                  PÁG {paginaMobile} / {Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA)}
                </Typography>

                <Button
                  disabled={paginaMobile >= Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA)}
                  onClick={() => {
                    const maxP = Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA);
                    setPaginaMobile(prev => Math.min(prev + 1, maxP));
                    mobileContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  size="small"
                  sx={{
                    border: '2px solid #020617',
                    bgcolor: paginaMobile >= Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA) ? '#e2e8f0' : '#020617',
                    color: paginaMobile >= Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA) ? '#94a3b8' : '#ccff00',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    fontFamily: 'ui-monospace, monospace',
                    borderRadius: 0,
                    boxShadow: paginaMobile >= Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA) ? 'none' : '2px 2px 0px #000',
                    px: 1.5,
                    py: 0.75,
                    opacity: paginaMobile >= Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA) ? 0.5 : 1,
                  }}
                >
                  PRÓXIMA →
                </Button>
              </Box>
            )}
          </Box>

          {/* DESKTOP TABLE VIEW (md screens and up >=768px) */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: '4px solid #020617', overflowX: 'auto' }}>
            <div
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLUMNS,
                backgroundColor: '#020617',
                minWidth: 800,
              }}
            >
              {['EMPRESA', 'PLATAFORMA', 'CARGO', 'TÍTULO DA VAGA', 'LOCALIDADE', 'AÇÃO'].map(h => (
                <div key={h} role="columnheader" style={{ color: '#ccff00', fontWeight: 900, padding: '10px 12px', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace' }}>
                  {h}
                </div>
              ))}
            </div>

            <div ref={parentRef} style={{ height: '60vh', overflowY: 'auto', minWidth: 800 }}>
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const vaga = vagasFiltradas[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      role="row"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                        display: 'grid',
                        gridTemplateColumns: GRID_COLUMNS,
                        alignItems: 'center',
                        backgroundColor: virtualRow.index % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ fontWeight: 800, color: '#020617', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {vaga.empresa}
                        </span>
                      </div>

                      <div style={{ padding: '10px 12px', minWidth: 0 }}>
                        <span style={{
                          border: '2px solid #020617',
                          backgroundColor: vaga.plataforma === 'Gupy' ? '#ccff00' : '#e2e8f0',
                          color: '#020617',
                          fontWeight: 900,
                          fontSize: '0.55rem',
                          padding: '2px 6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                          display: 'inline-block',
                        }}>
                          {vaga.plataforma}
                        </span>
                      </div>

                      <div style={{ padding: '10px 12px', fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>
                        {vaga.cargo_categoria}
                      </div>

                      <div style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#020617', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vaga.titulo_vaga}
                      </div>

                      <div style={{ padding: '10px 12px', fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vaga.local}
                      </div>

                      <div style={{ padding: '10px 12px' }}>
                        <a
                          href={vaga.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Ver vaga ${vaga.titulo_vaga} na ${vaga.empresa}`}
                          style={{
                            backgroundColor: '#020617',
                            color: '#ccff00',
                            fontWeight: 900,
                            fontSize: '0.6rem',
                            padding: '5px 10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            textDecoration: 'none',
                            border: '2px solid #020617',
                            fontFamily: 'ui-monospace, monospace',
                            boxShadow: '2px 2px 0px #000',
                            display: 'inline-block',
                          }}
                        >
                          VER VAGA
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Box>
        </>
      )}

      {!loading && vagasFiltradas.length > 0 && (
        <Typography sx={{ mt: 2, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Exibindo {vagasFiltradas.length} vaga{vagasFiltradas.length === 1 ? '' : 's'}
        </Typography>
      )}
      </Box>
    </>
  );
}
