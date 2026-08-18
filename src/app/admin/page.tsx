import { requireAdminPage } from '@/lib/api/admin-page-guard';
import { getAdminStats, resolveAdminRange } from '@/lib/core/admin/admin-stats';
import { formatDayShort } from '@/lib/core/admin/date-format';
import { getGlobalBudgetStatus } from '@/lib/infrastructure/redis/global-budget';
import { SectionEyebrow } from '@/components/ui/section-eyebrow';
import { AutoRefresh } from '@/components/admin/auto-refresh';
import { DateRangeFilter } from '@/components/admin/date-range-filter';
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client';

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

      <AdminDashboardClient stats={stats} budget={budget} periodLabel={periodLabel} />

      <AutoRefresh />
    </>
  );
}