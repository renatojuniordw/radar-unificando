'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, IconButton,
  Select, MenuItem, InputAdornment, Autocomplete, Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useDebounce } from 'use-debounce';
import { useVirtualizer } from '@tanstack/react-virtual';

const GRID_COLUMNS = '200px 140px 140px 1fr 160px 90px';


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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const parentRef = useRef<HTMLDivElement>(null);

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
    estimateSize: () => (viewMode === 'cards' ? 96 : 52),
    overscan: 10,
  });

  return (
    <div className="card-brutalist" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '1.1rem' }}>
          {vagasFiltradas.length} VAGAS ENCONTRADAS
        </Typography>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
            onChange={(_, v) => { setFiltroEmpresa(v || ''); }}
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
            onChange={(_, v) => { setFiltroModalidade(v || ''); }}
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

          <div style={{ display: 'flex', gap: 0 }}>
            <TextField
              size="small" value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)}
              placeholder="Buscar..."
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ width: 160 }}
            />
            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 0, border: '4px solid #020617', boxShadow: '2px 2px 0px #000', fontWeight: 900 }}>
              IR
            </Button>
          </div>
        </div>
      </div>

      {vagas.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Box sx={{ display: 'flex', border: '2px solid #020617' }}>
            <IconButton
              onClick={() => setViewMode('table')}
              aria-label="Visualizar em tabela"
              size="small"
              sx={{ borderRadius: 0, bgcolor: viewMode === 'table' ? '#020617' : 'transparent', color: viewMode === 'table' ? '#ccff00' : '#020617' }}
            >
              <TableRowsIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('cards')}
              aria-label="Visualizar em cards"
              size="small"
              sx={{ borderRadius: 0, bgcolor: viewMode === 'cards' ? '#020617' : 'transparent', color: viewMode === 'cards' ? '#ccff00' : '#020617' }}
            >
              <ViewModuleIcon fontSize="small" />
            </IconButton>
          </Box>
          <button
            onClick={onExportCsv}
            style={{
              border: '2px solid #020617',
              background: 'none',
              fontWeight: 900,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            ↓ EXPORTAR CSV
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 12px' }}>
              <Skeleton variant="rectangular" width={120} height={16} />
              <Skeleton variant="rectangular" width={60} height={16} />
              <Skeleton variant="rectangular" width={100} height={16} />
              <Skeleton variant="rectangular" width={200} height={16} />
              <Skeleton variant="rectangular" width={80} height={16} />
            </div>
          ))}
        </div>
      ) : vagasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
          <SearchOffIcon style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }} />
          <Typography sx={{ fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Nenhuma vaga encontrada
          </Typography>
          <Typography sx={{ marginBottom: 16, maxWidth: 400, margin: '0 auto 16px', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {vagas.length === 0
              ? 'Preencha os campos acima e clique em EXECUTAR BUSCA para começar.'
              : 'Tente remover alguns filtros ou buscar por termos diferentes.'}
          </Typography>
          {vagas.length === 0 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Analista de Dados', 'Data Engineer', 'Growth', 'BI Analyst'].map(s => (
                <span key={s} style={{
                  border: '2px solid #020617',
                  padding: '2px 8px',
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  fontFamily: 'ui-monospace, monospace',
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div style={{ border: '4px solid #020617' }}>
          <div
            role="row"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              backgroundColor: '#020617',
            }}
          >
            {['EMPRESA', 'PLAT', 'CARGO', 'TÍTULO', 'LOCAL', 'LINK'].map(h => (
              <div key={h} role="columnheader" style={{ color: '#ccff00', fontWeight: 700, padding: '8px 12px', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace' }}>
                {h}
              </div>
            ))}
          </div>

          <div ref={parentRef} style={{ height: '60vh', overflow: 'auto' }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const vaga = vagasFiltradas[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    role="row"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'grid',
                      gridTemplateColumns: GRID_COLUMNS,
                      alignItems: 'center',
                      backgroundColor: vaga.na_lista === 'Sim' ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                      borderBottom: '2px solid #f1f5f9',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {vaga.na_lista === 'Sim' && (
                        <span style={{
                          backgroundColor: '#020617',
                          color: '#ccff00',
                          fontWeight: 900,
                          fontSize: '0.45rem',
                          padding: '1px 4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          LISTA
                        </span>
                      )}
                      <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vaga.empresa}</span>
                    </div>
                    <div style={{ padding: '8px 12px', minWidth: 0 }}>
                      <span style={{
                        border: '2px solid',
                        borderColor: vaga.plataforma === 'Gupy' ? '#ccff00' : '#94a3b8',
                        color: vaga.plataforma === 'Gupy' ? '#020617' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.55rem',
                        padding: '1px 6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}>
                        {vaga.plataforma}
                      </span>
                      <div style={{ fontSize: '0.45rem', color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vaga.nome_na_plataforma}
                      </div>
                    </div>
                    <div style={{ padding: '8px 12px', fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vaga.cargo_categoria}</div>
                    <div style={{ padding: '8px 12px', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vaga.titulo_vaga}</div>
                    <div style={{ padding: '8px 12px', fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vaga.local}</div>
                    <div style={{ padding: '8px 12px' }}>
                      <a
                        href={vaga.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver vaga ${vaga.titulo_vaga} na ${vaga.empresa}`}
                        style={{
                          backgroundColor: '#020617',
                          color: '#ccff00',
                          fontWeight: 900,
                          fontSize: '0.55rem',
                          padding: '4px 8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          textDecoration: 'none',
                          border: '2px solid #020617',
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        VER
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div ref={parentRef} style={{ height: '60vh', overflow: 'auto' }}>
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const vaga = vagasFiltradas[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: '6px 0',
                  }}
                >
                  <div
                    className="card-brutalist"
                    style={{
                      padding: 12,
                      height: '100%',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      backgroundColor: vaga.na_lista === 'Sim' ? 'rgba(204, 255, 0, 0.05)' : undefined,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {vaga.na_lista === 'Sim' && (
                          <span style={{
                            backgroundColor: '#020617',
                            color: '#ccff00',
                            fontWeight: 900,
                            fontSize: '0.45rem',
                            padding: '1px 4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            LISTA
                          </span>
                        )}
                        <span style={{ fontWeight: 900, fontSize: '0.75rem' }}>{vaga.empresa}</span>
                        <span style={{
                          border: '2px solid',
                          borderColor: vaga.plataforma === 'Gupy' ? '#ccff00' : '#94a3b8',
                          color: vaga.plataforma === 'Gupy' ? '#020617' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.5rem',
                          padding: '1px 6px',
                          textTransform: 'uppercase',
                        }}>
                          {vaga.plataforma}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vaga.titulo_vaga}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{vaga.cargo_categoria} · {vaga.local}</div>
                    </div>
                    <a
                      href={vaga.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ver vaga ${vaga.titulo_vaga} na ${vaga.empresa}`}
                      style={{
                        flexShrink: 0,
                        backgroundColor: '#020617',
                        color: '#ccff00',
                        fontWeight: 900,
                        fontSize: '0.6rem',
                        padding: '6px 12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textDecoration: 'none',
                        border: '2px solid #020617',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      VER
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && vagasFiltradas.length > 0 && (
        <Typography sx={{ mt: 1.5, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          {vagasFiltradas.length} vaga{vagasFiltradas.length === 1 ? '' : 's'}
        </Typography>
      )}
    </div>
  );
}
