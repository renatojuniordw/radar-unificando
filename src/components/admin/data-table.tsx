'use client';

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
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: 'none',
};

/** Tabela de ranking (ex.: top termos/empresas pesquisados). */
export function TopDataTable({ title, data }: Props) {
  return (
    <div className="card-brutalist" style={{ padding: 20 }}>
      <h2
        style={{
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          fontSize: '0.8rem',
          color: '#020617',
          margin: '0 0 16px',
        }}
      >
        {title}
      </h2>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#020617' }}>
            <TableCell sx={headerCellStyle}>Item</TableCell>
            <TableCell align="right" sx={headerCellStyle}>
              Qtd
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} sx={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Sem dados no período
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow
                key={`${row.name}-${i}`}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' },
                  '&:last-child td': { borderBottom: 'none' },
                }}
              >
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#020617', borderBottom: '1px solid #e2e8f0' }}>
                  {row.name}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#020617', borderBottom: '1px solid #e2e8f0' }}>
                  {row.count}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}