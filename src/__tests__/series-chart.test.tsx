// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeriesChart } from '@/components/admin/charts/series-chart';

vi.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

vi.mock('@/lib/core/admin/date-format', () => ({
  formatDayShort: (date: string) => date.slice(8, 10) + '/' + date.slice(5, 7) + '/' + date.slice(2, 4),
  formatDayFull: (date: string) => date.slice(8, 10) + '/' + date.slice(5, 7) + '/' + date.slice(0, 4),
}));

describe('SeriesChart', () => {
  const mockData = [
    { date: '2026-08-15', count: 10 },
    { date: '2026-08-16', count: 15 },
    { date: '2026-08-17', count: 12 },
  ];

  it('should render chart title', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} />);

    expect(screen.getByText('Usuários por Dia')).toBeTruthy();
  });

  it('should render chart container', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('line-chart')).toBeTruthy();
  });

  it('should handle empty data', () => {
    render(<SeriesChart title="Usuários por Dia" data={[]} />);

    expect(screen.getByText('Usuários por Dia')).toBeTruthy();
    expect(screen.getByTestId('line-chart')).toBeTruthy();
  });

  it('should render with custom color', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} color="#ff0000" />);

    expect(screen.getByText('Usuários por Dia')).toBeTruthy();
  });

  it('should pass data to LineChart', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} />);

    const lineChart = screen.getByTestId('line-chart');
    expect(lineChart.getAttribute('data-length')).toBe('3');
  });
});
