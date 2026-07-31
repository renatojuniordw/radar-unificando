'use client';

interface Props {
  percent: number;
  completedCount: number;
  totalCount: number;
  skills: string[];
}

export function ProfileCompletionCard({ percent, completedCount, totalCount, skills }: Props) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{
          fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase',
          fontFamily: 'ui-monospace, monospace',
        }}>
          Perfil {percent >= 80 ? 'completo' : percent >= 50 ? 'em andamento' : 'incompleto'}
        </span>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: '0.6rem', color: '#64748b',
          textTransform: 'uppercase',
        }}>
          {completedCount}/{totalCount} itens
        </span>
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 0 }}>
        <div style={{
          height: '100%', width: `${percent}%`,
          backgroundColor: percent >= 80 ? '#16a34a' : '#ccff00',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}
