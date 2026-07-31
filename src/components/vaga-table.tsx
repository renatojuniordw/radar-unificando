'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button,
  Select, MenuItem, InputAdornment, Autocomplete, Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import DownloadIcon from '@mui/icons-material/Download';
import { useDebounce } from 'use-debounce';
import { useVirtualizer } from '@tanstack/react-virtual';

const GRID_COLUMNS = '180px 120px 140px 1fr 150px 90px';

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
  const [isMobile, setIsMobile] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  // Responsive mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    estimateSize: () => (isMobile ? 140 : 54),
    overscan: 8,
  });

  return (
    <div className="card-brutalist" style={{ padding: '20px' }}>
      {/* Header & Filter Controls Bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: { xs: '1rem', md: '1.2rem' }, color: '#020617' }}>
              {vagasFiltradas.length} VAGAS ENCONTRADAS
            </Typography>
            <Typography sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.25 }}>
              Atualizado em tempo real
            </Typography>
          </div>

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
        </div>

        {/* Filters Input Grid */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: '120px 180px 160px 180px 1fr',
            },
            gap: 1.5,
            alignItems: 'center',
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
              placeholder="Buscar..."
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
                px: 2,
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
      </div>

      {/* Main Results View */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px', border: '2px solid #e2e8f0' }}>
              <Skeleton variant="rectangular" width={120} height={20} />
              <Skeleton variant="rectangular" width={60} height={20} />
              <Skeleton variant="rectangular" width={100} height={20} />
              <Skeleton variant="rectangular" width={200} height={20} />
              <Skeleton variant="rectangular" width={80} height={20} />
            </div>
          ))}
        </div>
      ) : vagasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
          <SearchOffIcon style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }} />
          <Typography sx={{ fontWeight: 900, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#020617' }}>
            Nenhuma vaga encontrada
          </Typography>
          <Typography sx={{ marginBottom: 16, maxWidth: 420, margin: '0 auto 16px', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#64748b' }}>
            {vagas.length === 0
              ? 'Preencha os campos acima e clique em IR para buscar vagas.'
              : 'Tente remover alguns filtros ou buscar por termos diferentes.'}
          </Typography>
          {vagas.length === 0 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Analista de Dados', 'Data Engineer', 'Growth', 'BI Analyst'].map(s => (
                <span key={s} style={{
                  border: '2px solid #020617',
                  padding: '4px 10px',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  fontFamily: 'ui-monospace, monospace',
                  backgroundColor: '#f8fafc',
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : isMobile ? (
        /* Mobile Card View (<768px) */
        <div ref={parentRef} style={{ height: '65vh', overflow: 'auto', paddingRight: 4 }}>
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const vaga = vagasFiltradas[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: 10,
                  }}
                >
                  <div
                    style={{
                      padding: 14,
                      backgroundColor: vaga.na_lista === 'Sim' ? 'rgba(204, 255, 0, 0.08)' : '#ffffff',
                      border: '3px solid #020617',
                      boxShadow: '3px 3px 0px #000',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {/* Top Row: Empresa & Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        {vaga.na_lista === 'Sim' && (
                          <span style={{
                            backgroundColor: '#020617',
                            color: '#ccff00',
                            fontWeight: 900,
                            fontSize: '0.5rem',
                            padding: '2px 5px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                          }}>
                            LISTA
                          </span>
                        )}
                        <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#020617', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {vaga.empresa}
                        </span>
                      </div>
                      <span style={{
                        border: '2px solid #020617',
                        backgroundColor: vaga.plataforma === 'Gupy' ? '#ccff00' : '#e2e8f0',
                        color: '#020617',
                        fontWeight: 900,
                        fontSize: '0.55rem',
                        padding: '2px 6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                      }}>
                        {vaga.plataforma}
                      </span>
                    </div>

                    {/* Middle: Title */}
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#020617', lineHeight: 1.3 }}>
                      {vaga.titulo_vaga}
                    </div>

                    {/* Details: Cargo & Local */}
                    <div style={{ display: 'flex', gap: 6, fontSize: '0.7rem', color: '#64748b', fontFamily: 'ui-monospace, monospace', flexWrap: 'wrap' }}>
                      {vaga.cargo_categoria && <span>{vaga.cargo_categoria}</span>}
                      {vaga.local && <span>· {vaga.local}</span>}
                    </div>

                    {/* Action Button */}
                    <div style={{ marginTop: 4 }}>
                      <a
                        href={vaga.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver vaga ${vaga.titulo_vaga} na ${vaga.empresa}`}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          backgroundColor: '#020617',
                          color: '#ccff00',
                          fontWeight: 900,
                          fontSize: '0.7rem',
                          padding: '8px 14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          textDecoration: 'none',
                          border: '2px solid #020617',
                          fontFamily: 'ui-monospace, monospace',
                          boxShadow: '2px 2px 0px #000',
                        }}
                      >
                        VER VAGA →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Desktop Table View (>=768px) */
        <div style={{ border: '4px solid #020617', overflowX: 'auto' }}>
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
                      backgroundColor: vaga.na_lista === 'Sim' ? 'rgba(204, 255, 0, 0.06)' : (virtualRow.index % 2 === 0 ? '#ffffff' : '#f8fafc'),
                      borderBottom: '1px solid #e2e8f0',
                      fontSize: '0.75rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {vaga.na_lista === 'Sim' && (
                        <span style={{
                          backgroundColor: '#020617',
                          color: '#ccff00',
                          fontWeight: 900,
                          fontSize: '0.45rem',
                          padding: '1px 4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}>
                          LISTA
                        </span>
                      )}
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
        </div>
      )}

      {!loading && vagasFiltradas.length > 0 && (
        <Typography sx={{ mt: 2, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Exibindo {vagasFiltradas.length} vaga{vagasFiltradas.length === 1 ? '' : 's'}
        </Typography>
      )}
    </div>
  );
}
