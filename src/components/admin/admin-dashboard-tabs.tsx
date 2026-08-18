'use client';

export type AdminTab = 'overview' | 'search' | 'infrastructure';

interface Props {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
}

const TABS: { id: AdminTab; label: string; description: string }[] = [
  {
    id: 'overview',
    label: '📊 Visão Geral',
    description: 'Métricas principais de usuários, acessos e evolução diária',
  },
  {
    id: 'search',
    label: '🔍 Buscas & Engajamento',
    description: 'Rankings de pesquisas, empresas e ferramentas mais utilizadas',
  },
  {
    id: 'infrastructure',
    label: '⚡ Infraestrutura & Custos',
    description: 'Consumo de orçamento de IA, tokens, chat e extensão',
  },
];

export function AdminDashboardTabs({ activeTab, onChangeTab }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Sub-abas do Dashboard Admin"
      style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '12px 18px',
              border: '2px solid #020617',
              backgroundColor: isActive ? '#ccff00' : '#ffffff',
              color: '#020617',
              boxShadow: isActive ? '4px 4px 0px #020617' : '2px 2px 0px #020617',
              transform: isActive ? 'translate(-2px, -2px)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              flex: '1 1 200px',
              minWidth: 180,
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>{tab.label}</span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'none',
                color: isActive ? '#020617' : '#475569',
                letterSpacing: 'normal',
                textAlign: 'left',
              }}
            >
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
