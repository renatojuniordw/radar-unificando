// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeriesChart } from '@/components/admin/charts/series-chart';

// Mock do recharts que captura as props de cada submódulo (eixos, tooltip, linha)
// para assertar formatação de datas do eixo X e tooltip, e configuração da linha.
vi.mock('recharts', () => {
  const XAxis = ({ dataKey, tickFormatter }: any) => (
    <div data-testid="x-axis" data-data-key={dataKey ?? ''}>
      {typeof tickFormatter === 'function' ? tickFormatter('2026-08-17') : ''}
    </div>
  );
  const YAxis = ({ allowDecimals }: any) => <div data-testid="y-axis" data-allow-decimals={allowDecimals} />;
  const Tooltip = ({ labelFormatter }: any) => (
    <div data-testid="tooltip">{typeof labelFormatter === 'function' ? labelFormatter('2026-08-17') : ''}</div>
  );
  const LineChart = ({ children, data }: any) => (
    <div data-testid="line-chart" data-length={data?.length}>
      {children}
    </div>
  );
  const Line = ({ dataKey, stroke, strokeWidth, dot }: any) => (
    <div data-testid="line" data-data-key={dataKey} data-stroke={stroke} data-stroke-width={strokeWidth} data-dot={String(dot)} />
  );
  const CartesianGrid = () => null;
  const ResponsiveContainer = ({ children }: any) => <div data-testid="responsive-container">{children}</div>;
  return { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer };
});

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

  it('should render chart container and pass data length', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('line-chart').getAttribute('data-length')).toBe('3');
  });

  it('should format x-axis ticks and tooltip labels with dd/mm date', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} />);

    // formatDayShort('2026-08-17') = '17/08/26' no eixo X.
    expect(screen.getByTestId('x-axis').getAttribute('data-data-key')).toBe('date');
    expect(screen.getByTestId('x-axis').textContent).toContain('17/08/26');
    // formatDayFull('2026-08-17') = '17/08/2026' no tooltip.
    expect(screen.getByTestId('tooltip').textContent).toContain('17/08/2026');
  });

  it('should render line with count dataKey, default color and no dots', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} />);

    const line = screen.getByTestId('line');
    expect(line.getAttribute('data-data-key')).toBe('count');
    expect(line.getAttribute('data-stroke')).toBe('#ccff00');
    expect(line.getAttribute('data-stroke-width')).toBe('3');
    expect(line.getAttribute('data-dot')).toBe('false');
  });

  it('should render with custom color', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} color="#ff0000" />);

    expect(screen.getByTestId('line').getAttribute('data-stroke')).toBe('#ff0000');
  });

  it('should handle empty data', () => {
    render(<SeriesChart title="Usuários por Dia" data={[]} />);

    expect(screen.getByText('Usuários por Dia')).toBeTruthy();
    expect(screen.getByTestId('line-chart').getAttribute('data-length')).toBe('0');
  });

  it('should handle all zero counts', () => {
    render(
      <SeriesChart
        title="Usuários por Dia"
        data={[
          { date: '2026-08-15', count: 0 },
          { date: '2026-08-16', count: 0 },
        ]}
      />,
    );

    expect(screen.getByTestId('line-chart').getAttribute('data-length')).toBe('2');
    expect(screen.getByText('Usuários por Dia')).toBeTruthy();
  });

  it('should render y-axis without decimal values', () => {
    render(<SeriesChart title="Usuários por Dia" data={mockData} />);

    expect(screen.getByTestId('y-axis').getAttribute('data-allow-decimals')).toBe('false');
  });
});