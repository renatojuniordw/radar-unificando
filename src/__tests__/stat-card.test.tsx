// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/admin/stat-card';

describe('StatCard', () => {
  it('should render label and value', () => {
    render(<StatCard label="Total Usuários" value={1234} />);

    expect(screen.getByText('Total Usuários')).toBeTruthy();
    expect(screen.getByText('1.234')).toBeTruthy();
  });

  it('should render string value', () => {
    render(<StatCard label="Status" value="Ativo" />);

    expect(screen.getByText('Status')).toBeTruthy();
    expect(screen.getByText('Ativo')).toBeTruthy();
  });

  it('should render detail text when provided', () => {
    render(<StatCard label="Tokens" value={5000} detail="23% do limite" />);

    expect(screen.getByText('23% do limite')).toBeTruthy();
  });

  it('should render progress bar when progress prop is provided', () => {
    render(<StatCard label="Uso" value={75} progress={60} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute('aria-valuenow')).toBe('60');
  });

  it('should clamp progress value to 0-100 range', () => {
    render(<StatCard label="Uso" value={50} progress={150} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('should clamp negative progress to 0', () => {
    render(<StatCard label="Uso" value={50} progress={-10} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('should not render progress bar when progress prop is not provided', () => {
    render(<StatCard label="Total" value={100} />);

    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('should render detail when provided alongside progress', () => {
    render(<StatCard label="Tokens" value={1000} progress={45} detail="Restantes" />);

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByText('Restantes')).toBeTruthy();
  });
});
