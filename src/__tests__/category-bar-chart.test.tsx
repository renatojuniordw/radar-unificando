// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBarChart } from '@/components/admin/charts/category-bar-chart';

vi.mock('recharts', () => ({
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  Bar: () => null,
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

describe('CategoryBarChart', () => {
  const mockData = [
    { name: 'React', count: 15 },
    { name: 'TypeScript', count: 12 },
    { name: 'Node.js', count: 8 },
  ];

  it('should render chart title', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} />);

    expect(screen.getByText('Tecnologias')).toBeTruthy();
  });

  it('should render chart container', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('bar-chart')).toBeTruthy();
  });

  it('should render vertical bar chart when horizontal prop is true', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} horizontal />);

    expect(screen.getByTestId('bar-chart')).toBeTruthy();
  });

  it('should handle empty data', () => {
    render(<CategoryBarChart title="Tecnologias" data={[]} />);

    expect(screen.getByText('Tecnologias')).toBeTruthy();
    expect(screen.getByTestId('bar-chart')).toBeTruthy();
  });

  it('should render with custom color', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} color="#ff0000" />);

    expect(screen.getByText('Tecnologias')).toBeTruthy();
  });
});
