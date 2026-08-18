'use client';

import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import type { AdminUserRow } from '@/lib/core/admin/admin-users';
import { formatDateTimeSp } from '@/lib/core/admin/date-format';

interface Props {
  users: AdminUserRow[];
}

const headerCellStyle = {
  color: '#ccff00',
  fontFamily: 'ui-monospace, monospace',
  fontWeight: 900,
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: 'none',
  whiteSpace: 'nowrap',
};

const cellStyle = {
  fontSize: '0.75rem',
  color: '#020617',
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap',
};

/** Lista de usuários cadastrados com consumo agregado. */
export function UsersTable({ users }: Props) {
  return (
    <div className="card-brutalist" style={{ padding: 20, overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#020617' }}>
            <TableCell sx={headerCellStyle}>Usuário</TableCell>
            <TableCell sx={headerCellStyle}>Role</TableCell>
            <TableCell sx={headerCellStyle}>Cadastro</TableCell>
            <TableCell sx={headerCellStyle}>Último login</TableCell>
            <TableCell align="right" sx={headerCellStyle}>Tokens</TableCell>
            <TableCell align="right" sx={headerCellStyle}>Msgs chat</TableCell>
            <TableCell align="right" sx={headerCellStyle}>Buscas</TableCell>
            <TableCell align="right" sx={headerCellStyle}>Vagas</TableCell>
            <TableCell align="right" sx={headerCellStyle}>Cursos</TableCell>
            <TableCell align="right" sx={headerCellStyle}>Extensão</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} sx={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Nenhum usuário cadastrado
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' } }}>
                <TableCell sx={{ ...cellStyle, fontWeight: 800 }}>
                  {u.email}
                  {u.name && <span style={{ color: '#64748b', fontWeight: 500 }}> · {u.name}</span>}
                </TableCell>
                <TableCell sx={cellStyle}>
                  <span
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: u.role === 'admin' ? '#ccff00' : '#e2e8f0',
                      padding: '2px 6px',
                    }}
                  >
                    {u.role}
                  </span>
                </TableCell>
                <TableCell sx={cellStyle}>{formatDateTimeSp(u.createdAt)}</TableCell>
                <TableCell sx={cellStyle}>{u.lastLoginAt ? formatDateTimeSp(u.lastLoginAt) : '—'}</TableCell>
                <TableCell align="right" sx={{ ...cellStyle, fontWeight: 800 }}>{u.tokens.toLocaleString('pt-BR')}</TableCell>
                <TableCell align="right" sx={cellStyle}>{u.chatMessages}</TableCell>
                <TableCell align="right" sx={cellStyle}>{u.searches}</TableCell>
                <TableCell align="right" sx={cellStyle}>{u.jobs}</TableCell>
                <TableCell align="right" sx={cellStyle}>{u.courseClicks}</TableCell>
                <TableCell align="right" sx={cellStyle}>{u.extensionTokens}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}