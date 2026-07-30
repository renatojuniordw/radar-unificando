'use client';

import { useState } from 'react';
import type { Session } from 'next-auth';
import {
  Box, Typography, TextField, Button,
  Select, MenuItem, InputAdornment, Autocomplete,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
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
    <div className="card-brutalist" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '1.1rem' }}>
          {vagasFiltradas.length} VAGAS ENCONTRADAS
        </Typography>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            value={filtroPlataforma}
            onChange={e => { setFiltroPlataforma(e.target.value); handleFilterChange({ plataforma: e.target.value }); }}
            displayEmpty size="small" sx={{ minWidth: 120, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#020617', borderWidth: 2 } }}
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
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
            <div key={i} style={{ height: 40, background: '#f1f5f9', border: '2px solid #e2e8f0', animation: 'pulse-glow 1.5s infinite' }} />
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
      ) : (
        <>
          <div style={{ overflowX: 'auto', border: '4px solid #020617' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#020617' }}>
                  {['EMPRESA', 'PLAT', 'CARGO', 'TÍTULO', 'LOCAL', 'LINK', ...(session ? ['SCORE'] : [])].map(h => (
                    <th key={h} style={{ color: '#ccff00', fontWeight: 700, textAlign: 'left', padding: '8px 12px', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedVagas.map((vaga, i) => {
                  const vagaId = vaga.id;
                  const score = vagaId ? scores[String(vagaId)] : undefined;
                  return (
                    <tr
                      key={`${vaga.link}-${i}`}
                      style={{
                        backgroundColor: vaga.na_lista === 'Sim' ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                        borderBottom: '2px solid #f1f5f9',
                      }}
                    >
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                          <span style={{ fontWeight: 700 }}>{vaga.empresa}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
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
                        <div style={{ fontSize: '0.45rem', color: '#94a3b8', marginTop: 2 }}>
                          {vaga.nome_na_plataforma}
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: '0.65rem' }}>{vaga.cargo_categoria}</td>
                      <td style={{ padding: '8px 12px', fontSize: '0.7rem' }}>{vaga.titulo_vaga}</td>
                      <td style={{ padding: '8px 12px', fontSize: '0.65rem' }}>{vaga.local}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <a
                          href={vaga.link}
                          target="_blank"
                          rel="noopener noreferrer"
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
                      </td>
                      {session && (
                        <td style={{ padding: '8px 12px' }}>
                          {score ? (
                            <ScoreRing
                              score={score}
                              size={28}
                              thickness={3}
                              clickable
                              onClick={() => onJobClick({ id: String(vagaId), empresa: vaga.empresa, titulo: vaga.titulo_vaga, score })}
                            />
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Por página:</span>
              <select
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                style={{
                  border: '2px solid #020617',
                  fontWeight: 700,
                  padding: '4px 8px',
                  fontFamily: 'inherit',
                  fontSize: '0.65rem',
                  background: '#fff',
                }}
              >
                {[10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>{page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, vagasFiltradas.length)} de {vagasFiltradas.length}</span>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  border: '2px solid #020617',
                  background: page === 0 ? '#f1f5f9' : '#fff',
                  fontWeight: 900,
                  padding: '4px 10px',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.65rem',
                  opacity: page === 0 ? 0.5 : 1,
                }}
              >
                ANTERIOR
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * rowsPerPage >= vagasFiltradas.length}
                style={{
                  border: '2px solid #020617',
                  background: (page + 1) * rowsPerPage >= vagasFiltradas.length ? '#f1f5f9' : '#fff',
                  fontWeight: 900,
                  padding: '4px 10px',
                  cursor: (page + 1) * rowsPerPage >= vagasFiltradas.length ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.65rem',
                  opacity: (page + 1) * rowsPerPage >= vagasFiltradas.length ? 0.5 : 1,
                }}
              >
                PRÓXIMA
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
