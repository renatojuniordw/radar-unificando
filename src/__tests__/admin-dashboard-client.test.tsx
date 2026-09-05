// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client';
import type { AdminStats } from '@/lib/core/admin/admin-stats';

// Os charts são carregados via next/dynamic (ssr: false). Em testes, substituímos
// o dynamic por um stub que captura as props passadas a cada chart (título, dados,
// horizontal, dateLabels) e renderiza o título, permitindo assertar o contrato
// de integração do dashboard com os charts sem montar recharts de verdade.
const { chartProps } = vi.hoisted(() => {
  const chartProps: any[] = [];
  return { chartProps };
});

vi.mock('next/dynamic', () => ({
  default: () => {
    const DashboardChartMock = (props: any) => {
      chartProps.push(props);
      return (
        <div
          data-testid="dashboard-chart"
          data-horizontal={Boolean(props.horizontal)}
          data-date-labels={Boolean(props.dateLabels)}
        >
          {props.title}
        </div>
      );
    };
    return DashboardChartMock;
  },
}));

const DEFAULT_BUDGET = { usedUsd: 12.5, limitUsd: 50, ratio: 0.3 };

function makeStats(overrides: Partial<AdminStats> = {}): AdminStats {
  return {
    summary: {
      totalUsers: 10,
      usersToday: 1,
      loginsToday: 2,
      searchesToday: 100,
      anonymousSearchesToday: 30,
      failedSearchesToday: 4,
      jobsFoundToday: 7,
      chatMessagesToday: 5,
      tokensToday: 500,
      courseClicksToday: 3,
      extensionTokens: 2,
    },
    timeSeries: {
      usersPerDay: [
        { date: '2026-08-15', count: 10 },
        { date: '2026-08-16', count: 15 },
      ],
      loginsPerDay: [
        { date: '2026-08-15', count: 2 },
        { date: '2026-08-16', count: 3 },
      ],
      searchesPerDay: [
        { date: '2026-08-15', count: 8 },
        { date: '2026-08-16', count: 5 },
      ],
    },
    top: {
      toolUsage: [
        { name: 'search_jobs', count: 5 },
        { name: 'analyze_ats', count: 3 },
      ],
    },
    ...overrides,
  };
}

function renderDashboard() {
  return render(
    <AdminDashboardClient
      stats={makeStats()}
      budget={DEFAULT_BUDGET}
      periodLabel="30 dias"
    />,
  );
}

describe('AdminDashboardClient', () => {
  beforeEach(() => {
    chartProps.length = 0;
  });

  it('should_render_overview_panel_by_default_with_five_stat_cards', () => {
    renderDashboard();

    // Os painéis usam id (não data-testid); só um tabpanel existe por vez.
    const overviewPanel = screen.getByRole('tabpanel');
    expect(overviewPanel.getAttribute('id')).toBe('panel-overview');
    expect(screen.getByText('Usuários totais')).toBeTruthy();
    expect(screen.getByText('Cadastros hoje')).toBeTruthy();
    expect(screen.getByText('Logins hoje')).toBeTruthy();
    expect(screen.getByText('Buscas hoje')).toBeTruthy();
    expect(screen.getByText('Vagas encontradas hoje')).toBeTruthy();
    expect(overviewPanel).toBeTruthy();
  });

  it('should_render_search_breakdown_as_anonymous_and_logged', () => {
    renderDashboard();

    // 100 buscas = 30 anônimas + 70 logadas (busca é a única métrica com detalhe calculado).
    const buscas = screen.getByText('Buscas hoje').closest('[data-testid="admin-stat-card"]');
    expect(within(buscas as HTMLElement).getByText('100')).toBeTruthy();
    expect(within(buscas as HTMLElement).getByText('30 anônimas · 70 logadas')).toBeTruthy();
  });

  it('should_render_three_charts_in_overview_with_period_label', () => {
    renderDashboard();

    expect(screen.getByText('Usuários por dia (30 dias)')).toBeTruthy();
    expect(screen.getByText('Logins por dia (30 dias)')).toBeTruthy();
    expect(screen.getByText('Buscas por dia (30 dias)')).toBeTruthy();

    const seriesCharts = chartProps.filter((p) => p.title.includes('por dia') && !p.title.includes('Buscas'));
    expect(seriesCharts).toHaveLength(2);
    expect(seriesCharts[0].data).toEqual(makeStats().timeSeries.usersPerDay);
    expect(seriesCharts[1].data).toEqual(makeStats().timeSeries.loginsPerDay);
  });

  it('should_pass_mapped_date_data_to_searches_category_chart_with_date_labels', () => {
    renderDashboard();

    const searchesChart = chartProps.find((p) => p.title === 'Buscas por dia (30 dias)');
    expect(searchesChart).toBeDefined();
    // timeSeries.searchesPerDay é remapeado de {date,count} → {name,count}.
    expect(searchesChart.data).toEqual([
      { name: '2026-08-15', count: 8 },
      { name: '2026-08-16', count: 5 },
    ]);
    expect(searchesChart.dateLabels).toBe(true);
    expect(searchesChart.horizontal).toBeUndefined();
  });

  it('should_switch_to_search_tab_and_render_search_metrics', () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('tab', { name: /Buscas & Engajamento/i }));

    expect(screen.getByRole('tabpanel').getAttribute('id')).toBe('panel-search');
    expect(screen.getByText('Buscas com erro hoje')).toBeTruthy();
    expect(screen.getByText('Ferramentas do chat mais usadas')).toBeTruthy();

    const toolChart = chartProps.find((p) => p.title === 'Ferramentas do chat mais usadas');
    expect(toolChart.horizontal).toBe(true);
    expect(toolChart.data).toEqual(makeStats().top.toolUsage);
  });

  it('should_switch_to_infrastructure_tab_and_render_budget_and_token_cards', () => {
    render(<AdminDashboardClient stats={makeStats()} budget={{ usedUsd: 12.5, limitUsd: 50, ratio: 0.3 }} periodLabel="30 dias" />);

    fireEvent.click(screen.getByRole('tab', { name: /Infraestrutura & Custos/i }));

    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('id')).toBe('panel-infrastructure');
    expect(within(panel).getByText('Custo IA hoje')).toBeTruthy();
    expect(within(panel).getByText('$12.50')).toBeTruthy();
    expect(within(panel).getByText('de $50.00')).toBeTruthy();
    expect(within(panel).getByText('Tokens usados hoje')).toBeTruthy();
    expect(screen.getByText('500')).toBeTruthy();
    expect(within(panel).getByText('Mensagens chat hoje')).toBeTruthy();
    expect(within(panel).getByText('Cliques em cursos hoje')).toBeTruthy();
    expect(within(panel).getByText('Tokens de extensão')).toBeTruthy();

    const progressbar = screen.getByRole('progressbar', { name: 'Custo IA hoje' });
    expect(progressbar.getAttribute('aria-valuenow')).toBe('30');
  });

  it('should_clamp_budget_progress_to_100_when_ratio_exceeds_limit', () => {
    render(
      <AdminDashboardClient
        stats={makeStats()}
        budget={{ usedUsd: 80, limitUsd: 50, ratio: 1.6 }}
        periodLabel="30 dias"
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: /Infraestrutura & Custos/i }));

    const progressbar = screen.getByRole('progressbar', { name: 'Custo IA hoje' });
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('should_format_large_metric_values_with_pt_br_locale', () => {
    render(
      <AdminDashboardClient
        stats={makeStats({ summary: { ...makeStats().summary, totalUsers: 1234567 } })}
        budget={DEFAULT_BUDGET}
        periodLabel="30 dias"
      />,
    );

    expect(screen.getByText('1.234.567')).toBeTruthy();
  });

  it('should_render_empty_state_when_time_series_has_no_data', () => {
    render(
      <AdminDashboardClient
        stats={makeStats({
          timeSeries: { usersPerDay: [], loginsPerDay: [], searchesPerDay: [] },
        })}
        budget={DEFAULT_BUDGET}
        periodLabel="30 dias"
      />,
    );

    expect(screen.getByText('Usuários totais')).toBeTruthy();
    expect(screen.getByText('Usuários por dia (30 dias)')).toBeTruthy();
    const usersChart = chartProps.find((p) => p.title === 'Usuários por dia (30 dias)');
    expect(usersChart.data).toEqual([]);
    const searchesChart = chartProps.find((p) => p.title === 'Buscas por dia (30 dias)');
    expect(searchesChart.data).toEqual([]);
  });

  it('should_display_zero_breakdown_when_there_are_no_searches', () => {
    render(
      <AdminDashboardClient
        stats={makeStats({
          summary: { ...makeStats().summary, searchesToday: 0, anonymousSearchesToday: 0 },
        })}
        budget={DEFAULT_BUDGET}
        periodLabel="30 dias"
      />,
    );

    const buscas = screen.getByText('Buscas hoje').closest('[data-testid="admin-stat-card"]');
    expect(within(buscas as HTMLElement).getByText('0 anônimas · 0 logadas')).toBeTruthy();
  });

  it('should_not_clamp_negative_logged_searches_breakdown', () => {
    // Comportamento observado: o componente subtrai anonymous de searches sem clamp.
    // Caso os dados de origem venham incoerentes (anônimas > buscas), o valor negativo
    // é exibido como está — documentado para não "inventar" um guard que não existe.
    render(
      <AdminDashboardClient
        stats={makeStats({
          summary: { ...makeStats().summary, searchesToday: 5, anonymousSearchesToday: 8 },
        })}
        budget={DEFAULT_BUDGET}
        periodLabel="30 dias"
      />,
    );

    const buscas = screen.getByText('Buscas hoje').closest('[data-testid="admin-stat-card"]');
    expect(within(buscas as HTMLElement).getByText('8 anônimas · -3 logadas')).toBeTruthy();
  });
});