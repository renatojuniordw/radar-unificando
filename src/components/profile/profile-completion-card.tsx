'use client';

import Link from 'next/link';

interface Props {
  percent: number;
  completedCount: number;
  totalCount: number;
  skills: string[];
  seniority?: string;
  currentRole?: string;
  area?: string;
  experienceYears?: number;
  resumeText?: string;
}

export function ProfileCompletionCard({ 
  percent, completedCount, totalCount, skills,
  seniority, currentRole, area, experienceYears, resumeText
}: Props) {
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
        
        {/* Progresso por categoria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
          {[
            { label: 'Skills', done: skills.length >= 3 },
            { label: 'Senioridade', done: !!seniority },
            { label: 'Experiência', done: (experienceYears || 0) > 0 },
            { label: 'Cargo', done: !!currentRole },
            { label: 'Área', done: !!area },
            { label: 'Currículo', done: (resumeText?.length || 0) > 50 },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.6rem', color: '#64748b', width: 70, fontFamily: 'ui-monospace, monospace' }}>
                {item.label}
              </span>
              <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                <div 
                  style={{ 
                    width: item.done ? '100%' : '0%', 
                    height: '100%', 
                    backgroundColor: item.done ? '#16a34a' : '#ccff00', 
                    borderRadius: 2, 
                    transition: 'width 0.3s' 
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
        
        {skills.length > 0 && (
          <Link href="/" style={{
            display: 'inline-block', marginTop: 12,
            fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase',
            letterSpacing: '0.02em', color: '#020617',
            fontFamily: 'ui-monospace, monospace',
            textDecoration: 'underline',
          }}>
            Ver vagas recomendadas →
          </Link>
        )}
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
