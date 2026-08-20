// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { UsersTable } from '@/components/admin/users-table';
import type { AdminUserRow } from '@/lib/core/admin/admin-users';

vi.mock('@/lib/core/admin/date-format', () => ({
  formatDateTimeSp: (date: Date) => {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  },
}));

describe('UsersTable', () => {
  const mockUsers: AdminUserRow[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date('2026-01-15T00:00:00Z'),
      lastLoginAt: new Date('2026-08-20T00:00:00Z'),
      tokens: 15000,
      chatMessages: 45,
      searches: 120,
      jobs: 30,
      courseClicks: 10,
      extensionTokens: 5000,
    },
    {
      id: '2',
      email: 'user@example.com',
      name: null,
      role: 'user',
      createdAt: new Date('2026-06-01T00:00:00Z'),
      lastLoginAt: null,
      tokens: 2500,
      chatMessages: 8,
      searches: 25,
      jobs: 3,
      courseClicks: 2,
      extensionTokens: 800,
    },
  ];

  it('should render table headers', () => {
    render(<UsersTable users={[]} />);

    expect(screen.getByText('Usuário')).toBeTruthy();
    expect(screen.getByText('Role')).toBeTruthy();
    expect(screen.getByText('Cadastro')).toBeTruthy();
    expect(screen.getByText('Último login')).toBeTruthy();
    expect(screen.getByText('Tokens')).toBeTruthy();
    expect(screen.getByText('Msgs chat')).toBeTruthy();
    expect(screen.getByText('Buscas')).toBeTruthy();
    expect(screen.getByText('Vagas')).toBeTruthy();
    expect(screen.getByText('Cursos')).toBeTruthy();
    expect(screen.getByText('Extensão')).toBeTruthy();
  });

  it('should render user rows with email and name', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText(/admin@example.com/)).toBeTruthy();
    expect(screen.getByText(/Admin User/)).toBeTruthy();
    expect(screen.getByText(/user@example.com/)).toBeTruthy();
  });

  it('should render user role with correct styling', () => {
    render(<UsersTable users={mockUsers} />);

    const adminRole = screen.getByText('admin');
    const userRole = screen.getByText('user');

    // Admin role should have yellow background
    expect(adminRole.closest('span')?.style.background).toBe('rgb(204, 255, 0)');
    // User role should have gray background
    expect(userRole.closest('span')?.style.background).toBe('rgb(226, 232, 240)');
  });

  it('should render user stats correctly', () => {
    render(<UsersTable users={mockUsers} />);

    // Check that stats are formatted with toLocaleString
    expect(screen.getByText('15.000')).toBeTruthy();
    expect(screen.getByText('2.500')).toBeTruthy();
  });

  it('should render empty state when no users', () => {
    render(<UsersTable users={[]} />);

    expect(screen.getByText('Nenhum usuário cadastrado')).toBeTruthy();
  });

  it('should render dash for users without lastLoginAt', () => {
    render(<UsersTable users={mockUsers} />);

    const lastLoginCells = screen.getAllByText('—');
    expect(lastLoginCells.length).toBe(1);
  });

  it('should render formatted dates', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('15/01/2026')).toBeTruthy();
    expect(screen.getByText('20/08/2026')).toBeTruthy();
    expect(screen.getByText('01/06/2026')).toBeTruthy();
  });

  it('should render each user row with correct data', () => {
    render(<UsersTable users={mockUsers} />);

    const rows = screen.getAllByRole('row');
    // Header row + 2 data rows
    expect(rows.length).toBe(3);

    // Check first user row contains expected data
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText(/admin@example.com/)).toBeTruthy();
    expect(within(firstDataRow).getByText('admin')).toBeTruthy();
  });
});
