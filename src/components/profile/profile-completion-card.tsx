'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

interface CheckItem {
  label: string;
  done: boolean;
}

interface Props {
  percent: number;
  completedCount: number;
  totalCount: number;
  checks: CheckItem[];
}

export function ProfileCompletionCard({ percent, completedCount, totalCount, checks }: Props) {
  return (
    <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
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
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 0, marginBottom: 16 }}>
        <div style={{
          height: '100%', width: `${percent}%`,
          backgroundColor: percent >= 80 ? '#16a34a' : '#ccff00',
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Checklist do que falta completar */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px 16px' }}>
        {checks.map((c) => (
          <li key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {c.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem',
              textTransform: 'uppercase', letterSpacing: '0.02em',
              color: c.done ? '#1e293b' : '#94a3b8',
            }}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}