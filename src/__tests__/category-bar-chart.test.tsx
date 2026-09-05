// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBarChart } from '@/components/admin/charts/category-bar-chart';

// Mock do recharts que captura as props de cada submódulo (eixos, tooltip, bar)
// para permitir assertar formatação de datas, layout horizontal e cores.
vi.mock('recharts', () => {
  const XAxis = ({ dataKey, tickFormatter, type }: any) => (
    <div data-testid="x-axis" data-data-key={dataKey ?? ''} data-type={type ?? ''}>
      {typeof tickFormatter === 'function' ? tickFormatter('2026-08-17') : ''}
    </div>
  );
  const YAxis = ({ dataKey, width, type, allowDecimals }: any) => (
    <div
      data-testid="y-axis"
      data-data-key={dataKey ?? ''}
      data-width={width ?? ''}
      data-type={type ?? ''}
      data-allow-decimals={allowDecimals}
    />
  );
  const Tooltip = ({ labelFormatter }: any) => (
    <div data-testid="tooltip">{typeof labelFormatter === 'function' ? labelFormatter('2026-08-17') : ''}</div>
  );
  const BarChart = ({ children, data, layout }: any) => (
    <div data-testid="bar-chart" data-length={data?.length} data-layout={layout ?? ''}>
      {children}
    </div>
  );
  const Bar = ({ dataKey, fill, stroke, strokeWidth }: any) => (
    <div data-testid="bar" data-data-key={dataKey} data-fill={fill} data-stroke={stroke} data-stroke-width={strokeWidth} />
  );
  const CartesianGrid = () => null;
  const ResponsiveContainer = ({ children }: any) => <div data-testid="responsive-container">{children}</div>;
  return { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer };
});

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

  it('should render chart container with vertical layout by default', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    const barChart = screen.getByTestId('bar-chart');
    expect(barChart.getAttribute('data-layout')).toBe('');
    expect(barChart.getAttribute('data-length')).toBe('3');
  });

  it('should use name as x-axis key on vertical layout', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} />);

    const xAxis = screen.getByTestId('x-axis');
    expect(xAxis.getAttribute('data-data-key')).toBe('name');
    expect(xAxis.getAttribute('data-type')).toBe('');
  });

  it('should pass count dataKey and default colors to Bar', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} />);

    const bar = screen.getByTestId('bar');
    expect(bar.getAttribute('data-data-key')).toBe('count');
    expect(bar.getAttribute('data-fill')).toBe('#ccff00');
    expect(bar.getAttribute('data-stroke')).toBe('#020617');
    expect(bar.getAttribute('data-stroke-width')).toBe('2');
  });

  it('should render horizontal layout with category y-axis when horizontal is true', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} horizontal />);

    const barChart = screen.getByTestId('bar-chart');
    // recharts expressa barras horizontais com layout="vertical".
    expect(barChart.getAttribute('data-layout')).toBe('vertical');

    expect(screen.getByTestId('x-axis').getAttribute('data-type')).toBe('number');
    const yAxis = screen.getByTestId('y-axis');
    expect(yAxis.getAttribute('data-data-key')).toBe('name');
    expect(yAxis.getAttribute('data-width')).toBe('150');
  });

  it('should format axis and tooltip labels when dateLabels is true', () => {
    render(
      <CategoryBarChart
        title="Buscas por dia"
        data={[
          { name: '2026-08-17', count: 8 },
          { name: '2026-08-18', count: 5 },
        ]}
        dateLabels
      />,
    );

    // formatDayShort('2026-08-17') = '17/08/26' no eixo X.
    expect(screen.getByTestId('x-axis').textContent).toContain('17/08/26');
    // formatDayFull('2026-08-17') = '17/08/2026' no tooltip.
    expect(screen.getByTestId('tooltip').textContent).toContain('17/08/2026');
  });

  it('should not format axis labels when dateLabels is false', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} />);

    expect(screen.getByTestId('x-axis').textContent).toBe('');
    expect(screen.getByTestId('tooltip').textContent).toBe('');
  });

  it('should handle empty data', () => {
    render(<CategoryBarChart title="Tecnologias" data={[]} />);

    expect(screen.getByText('Tecnologias')).toBeTruthy();
    expect(screen.getByTestId('bar-chart').getAttribute('data-length')).toBe('0');
  });

  it('should render with custom color', () => {
    render(<CategoryBarChart title="Tecnologias" data={mockData} color="#ff0000" />);

    expect(screen.getByTestId('bar').getAttribute('data-fill')).toBe('#ff0000');
  });

  it('should render with all zeros in data', () => {
    render(
      <CategoryBarChart
        title="Tecnologias"
        data={[
          { name: 'React', count: 0 },
          { name: 'Vue', count: 0 },
        ]}
      />,
    );

    expect(screen.getByTestId('bar-chart').getAttribute('data-length')).toBe('2');
    expect(screen.getByText('Tecnologias')).toBeTruthy();
  });
});