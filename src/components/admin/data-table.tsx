'use client';

import { useState, useMemo } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import type { NameCount } from '@/lib/core/admin/admin-stats';

interface Props {
  title: string;
  data: NameCount[];
}

const headerCellStyle = {
  color: '#ccff00',
  fontFamily: 'ui-monospace, monospace',
  fontWeight: 900,
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: 'none',
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.7rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  padding: '6px 12px',
  border: '2px solid #020617',
  backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
  color: disabled ? '#94a3b8' : '#020617',
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '2px 2px 0px #020617',
  transition: 'all 0.1s ease',
});

/** Tabela de ranking interativa com busca, paginação e destaques (Neo-Brutalist). */
export function TopDataTable({ title, data }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Filtragem local
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase().trim();
    return data.filter((item) => item.name.toLowerCase().includes(term));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return (
    <div className="card-brutalist" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2
          style={{
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            fontSize: '0.85rem',
            color: '#020617',
            margin: 0,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.65rem',
            fontWeight: 800,
            color: '#475569',
            backgroundColor: '#f1f5f9',
            padding: '2px 8px',
            border: '1px solid #020617',
          }}
        >
          Total: {data.length}
        </span>
      </div>

      {/* Controles de Filtro e Tamanhos de Página */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar nesta tabela..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label={`Filtrar ${title}`}
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            padding: '6px 10px',
            border: '2px solid #020617',
            background: '#ffffff',
            color: '#020617',
            flex: '1 1 180px',
            maxWidth: 240,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', fontWeight: 800, color: '#475569' }}>
            Exibir:
          </span>
          {[5, 10, 20].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handlePageSizeChange(size)}
              aria-label={`Exibir ${size} itens por página`}
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '4px 8px',
                border: '1.5px solid #020617',
                backgroundColor: pageSize === size ? '#ccff00' : '#ffffff',
                color: '#020617',
                cursor: 'pointer',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#020617' }}>
            <TableCell sx={{ ...headerCellStyle, width: 60 }} align="center">
              #
            </TableCell>
            <TableCell sx={headerCellStyle}>Item</TableCell>
            <TableCell align="right" sx={headerCellStyle}>
              Qtd
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} sx={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', py: 3 }}>
                {search ? 'Nenhum resultado encontrado para o filtro' : 'Sem dados no período'}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, i) => {
              const globalIndex = (currentPage - 1) * pageSize + i + 1;
              const isTop3 = globalIndex <= 3;
              return (
                <TableRow
                  key={`${row.name}-${i}`}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', py: 1 }}>
                    <span
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '2px 6px',
                        border: '1px solid #020617',
                        backgroundColor: globalIndex === 1 ? '#ccff00' : isTop3 ? '#e2e8f0' : '#ffffff',
                        color: '#020617',
                        display: 'inline-block',
                      }}
                    >
                      #{globalIndex}
                    </span>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#020617', borderBottom: '1px solid #e2e8f0' }}>
                    {row.name}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#020617', borderBottom: '1px solid #e2e8f0' }}>
                    {row.count.toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>
            Página {currentPage} de {totalPages} ({filteredData.length} itens)
          </span>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={buttonStyle(currentPage <= 1)}
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={buttonStyle(currentPage >= totalPages)}
              aria-label="Próxima página"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}