'use client';

import { BaseCard } from '@/components/base-card';

interface Props {
  seniority: string;
  area: string;
  skills: string[];
  experienceYears: number;
  currentRole: string;
}

export function ProfileAIPreview({ seniority, area, skills, experienceYears, currentRole }: Props) {
  const perfilMinimo = skills.length >= 3 && (currentRole || area);
  
  return (
    <BaseCard title="COMO A IA VÊ SEU PERFIL" variant="highlight">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Senioridade</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
            {seniority || 'Não definida'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Área</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
            {area || 'Não definida'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Experiência</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
            {experienceYears > 0 ? `${experienceYears} anos` : 'Não informada'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Skills</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
            {skills.length > 0 
              ? `${skills.length} skills (${skills.slice(0, 3).join(', ')}${skills.length > 3 ? '...' : ''})`
              : 'Nenhuma'
            }
          </span>
        </div>
        
        <div style={{ 
          marginTop: 8, padding: '8px 12px', 
          backgroundColor: perfilMinimo ? '#f0fdf4' : '#fef2f2',
          borderRadius: 4,
          border: `1px solid ${perfilMinimo ? '#16a34a' : '#dc2626'}`
        }}>
          <span style={{ 
            fontSize: '0.65rem', fontWeight: 700,
            color: perfilMinimo ? '#16a34a' : '#dc2626'
          }}>
            {perfilMinimo 
              ? '✓ Perfil pronto para recomendações'
              : '⚠ Complete seu perfil para melhores recomendações'
            }
          </span>
        </div>
      </div>
    </BaseCard>
  );
}
