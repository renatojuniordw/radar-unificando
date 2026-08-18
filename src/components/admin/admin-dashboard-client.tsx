'use client';

import { useState } from 'react';
import { StatCard } from '@/components/admin/stat-card';
import { SeriesChart } from '@/components/admin/charts/series-chart';
import { CategoryBarChart } from '@/components/admin/charts/category-bar-chart';
import { AdminDashboardTabs, AdminTab } from '@/components/admin/admin-dashboard-tabs';
import type { AdminStats } from '@/lib/core/admin/admin-stats';

interface Props {
  stats: AdminStats;
  budget: {
    usedUsd: number;
    limitUsd: number;
    ratio: number;
  };
  periodLabel: string;
}

export function AdminDashboardClient({ stats, budget, periodLabel }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const { anonymousSearchesToday, searchesToday } = stats.summary;
  const loggedSearchesToday = searchesToday - anonymousSearchesToday;

  const searchesPerDay = stats.timeSeries.searchesPerDay.map((d) => ({
    name: d.date,
    count: d.count,
  }));

  return (
    <div>
      <AdminDashboardTabs activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* ABA 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <StatCard label="Vagas encontradas hoje" value={stats.summary.jobsFoundToday} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            <SeriesChart title={`Usuários por dia (${periodLabel})`} data={stats.timeSeries.usersPerDay} />
            <SeriesChart title={`Logins por dia (${periodLabel})`} data={stats.timeSeries.loginsPerDay} />
            <CategoryBarChart title={`Buscas por dia (${periodLabel})`} data={searchesPerDay} dateLabels />
          </div>
        </div>
      )}

      {/* ABA 2: BUSCAS & ENGAJAMENTO */}
      {activeTab === 'search' && (
        <div id="panel-search" role="tabpanel" aria-labelledby="tab-search">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard
              label="Buscas hoje"
              value={searchesToday}
              detail={`${anonymousSearchesToday} anônimas · ${loggedSearchesToday} logadas`}
            />
            <StatCard label="Buscas com erro hoje" value={stats.summary.failedSearchesToday} />
            <StatCard label="Vagas encontradas hoje" value={stats.summary.jobsFoundToday} />
          </div>

          <div style={{ marginTop: 24 }}>
            <CategoryBarChart title="Ferramentas do chat mais usadas" data={stats.top.toolUsage} horizontal />
          </div>
        </div>
      )}

      {/* ABA 3: INFRAESTRUTURA & CUSTOS */}
      {activeTab === 'infrastructure' && (
        <div id="panel-infrastructure" role="tabpanel" aria-labelledby="tab-infrastructure">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard
              label="Custo IA hoje"
              value={`$${budget.usedUsd.toFixed(2)}`}
              detail={`de $${budget.limitUsd.toFixed(2)}`}
              progress={budget.ratio * 100}
            />
            <StatCard label="Tokens usados hoje" value={stats.summary.tokensToday} />
            <StatCard label="Mensagens chat hoje" value={stats.summary.chatMessagesToday} />
            <StatCard label="Cliques em cursos hoje" value={stats.summary.courseClicksToday} />
            <StatCard label="Tokens de extensão" value={stats.summary.extensionTokens} />
          </div>
        </div>
      )}
    </div>
  );
}
