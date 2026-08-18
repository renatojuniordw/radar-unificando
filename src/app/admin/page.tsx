import { requireAdminPage } from '@/lib/api/admin-page-guard';
import { getAdminStats, resolveAdminRange } from '@/lib/core/admin/admin-stats';
import { formatDayShort } from '@/lib/core/admin/date-format';
import { getGlobalBudgetStatus } from '@/lib/infrastructure/redis/global-budget';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { StatCard } from '@/components/admin/stat-card';
import { AutoRefresh } from '@/components/admin/auto-refresh';
import { DateRangeFilter } from '@/components/admin/date-range-filter';
import { SeriesChart } from '@/components/admin/charts/series-chart';
import { CategoryBarChart } from '@/components/admin/charts/category-bar-chart';
import { TopDataTable } from '@/components/admin/data-table';

export const dynamic = 'force-dynamic';

interface AdminSearchParams {
  days?: string;
  from?: string;
  to?: string;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  // Guarda na própria página (antes de qualquer fetch) — o layout não impede a
  // renderização da página no payload do 404.
  await requireAdminPage();

  const params = await searchParams;
  const range = resolveAdminRange(params);
  const [stats, budget] = await Promise.all([getAdminStats(range), getGlobalBudgetStatus()]);

  const { anonymousSearchesToday, searchesToday } = stats.summary;
  const loggedSearchesToday = searchesToday - anonymousSearchesToday;

  const searchesPerDay = stats.timeSeries.searchesPerDay.map((d) => ({
    name: d.date,
    count: d.count,
  }));

  const periodLabel =
    params.from && params.to
      ? `${formatDayShort(params.from)} a ${formatDayShort(params.to)}`
      : `últimos ${Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000) + 1} dias`;

  return (
    <>
      <SectionEyebrow mb={1}>Painel Admin</SectionEyebrow>
      <h1
        style={{
          fontSize: '1.6rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: '#020617',
          margin: '0 0 24px',
        }}
      >
        Dashboard de métricas
      </h1>

      <DateRangeFilter days={Number(params.days) || 30} from={params.from} to={params.to} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard label="Usuários totais" value={stats.summary.totalUsers} />
        <StatCard label="Cadastros hoje" value={stats.summary.usersToday} />
        <StatCard label="Logins hoje" value={stats.summary.loginsToday} />
        <StatCard
          label="Buscas hoje"
          value={searchesToday}
          detail={`${anonymousSearchesToday} anônimas · ${loggedSearchesToday} logadas`}
        />
        <StatCard label="Buscas com erro hoje" value={stats.summary.failedSearchesToday} />
        <StatCard label="Vagas encontradas hoje" value={stats.summary.jobsFoundToday} />
        <StatCard label="Mensagens chat hoje" value={stats.summary.chatMessagesToday} />
        <StatCard label="Tokens usados hoje" value={stats.summary.tokensToday} />
        <StatCard
          label="Custo IA hoje"
          value={`$${budget.usedUsd.toFixed(2)}`}
          detail={`de $${budget.limitUsd.toFixed(2)}`}
          progress={budget.ratio * 100}
        />
        <StatCard label="Cliques em cursos hoje" value={stats.summary.courseClicksToday} />
        <StatCard label="Tokens de extensão" value={stats.summary.extensionTokens} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <SeriesChart title={`Usuários por dia (${periodLabel})`} data={stats.timeSeries.usersPerDay} />
        <SeriesChart title={`Logins por dia (${periodLabel})`} data={stats.timeSeries.loginsPerDay} />
        <CategoryBarChart title={`Buscas por dia (${periodLabel})`} data={searchesPerDay} dateLabels />
        <CategoryBarChart title="Ferramentas do chat mais usadas" data={stats.top.toolUsage} horizontal />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        <TopDataTable title={`Top termos pesquisados (${periodLabel})`} data={stats.top.topTerms} />
        <TopDataTable title={`Top empresas pesquisadas (${periodLabel})`} data={stats.top.topCompanies} />
      </div>

      <AutoRefresh />
    </>
  );
}