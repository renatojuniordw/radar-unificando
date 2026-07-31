'use client';

interface Props {
  percent: number;
  completedCount: number;
  totalCount: number;
  skills: string[];
}

export function ProfileCompletionCard({ percent, completedCount, totalCount, skills }: Props) {
  return (
    <div className="card-brutalist" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '4px solid', borderColor: percent >= 80 ? '#16a34a' : '#ccff00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.85rem', color: '#020617',
            backgroundColor: percent >= 80 ? '#16a34a' : '#ccff00',
          }}>
            {percent}%
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Perfil {percent >= 80 ? 'completo' : percent >= 50 ? 'em andamento' : 'incompleto'}
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>
              {completedCount} de {totalCount} itens preenchidos
            </div>
          </div>
        </div>
        <div style={{ height: 4, background: '#e2e8f0' }}>
          <div style={{ height: '100%', width: `${percent}%`, backgroundColor: percent >= 80 ? '#16a34a' : '#ccff00', transition: 'width 0.3s' }} />
        </div>
      </div>
      {skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {skills.slice(0, 5).map(s => (
            <span key={s} style={{
              border: '2px solid #020617', padding: '1px 6px',
              fontWeight: 700, fontSize: '0.5rem', textTransform: 'uppercase',
              fontFamily: 'ui-monospace, monospace',
            }}>
              {s}
            </span>
          ))}
          {skills.length > 5 && (
            <span style={{ color: '#64748b', fontSize: '0.5rem', fontWeight: 700 }}>
              +{skills.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
