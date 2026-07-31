'use client';

import { Autocomplete, TextField } from '@mui/material';

const SKILLS_BY_AREA: Record<string, string[]> = {
  Dados: ['Python', 'SQL', 'Spark', 'Airflow', 'dbt', 'Databricks', 'Snowflake', 'BigQuery'],
  BI: ['Power BI', 'Tableau', 'Looker', 'Metabase', 'ThoughtSpot', 'MicroStrategy'],
  Growth: ['Amplitude', 'Mixpanel', 'Google Analytics', 'Firebase', 'Hotjar', 'Optimizely'],
  Engenharia: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'GitHub Actions'],
  Produto: ['Jira', 'Confluence', 'Notion', 'Figma', 'Miro', 'Productboard'],
  Outro: ['Excel', 'SAP', 'Salesforce', 'HubSpot', 'Zendesk'],
};

const ALL_SUGGESTED_SKILLS = Object.values(SKILLS_BY_AREA).flat().sort();

interface Props {
  skills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
  onAddMany: (skills: string[]) => void;
}

export function SkillsSection({ skills, onAdd, onRemove, onAddMany }: Props) {
  return (
    <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: 0 }}>
          SKILLS {skills.length > 0 && <span style={{ border: '2px solid #020617', padding: '1px 6px', fontSize: '0.6rem', marginLeft: 8 }}>{skills.length}</span>}
        </h3>
      </div>

      <label htmlFor="skill-autocomplete" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
        Adicionar skill
      </label>
      <Autocomplete
        id="skill-autocomplete"
        options={ALL_SUGGESTED_SKILLS.filter(s => !skills.includes(s.toLowerCase()))}
        onChange={(_, value) => { if (value) onAdd(value); }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Digite ou selecione uma skill"
            size="small"
            slotProps={{ input: { ...params.InputProps, sx: { border: '4px solid #020617', boxShadow: '2px 2px 0px #000', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' } } }}
          />
        )}
        sx={{ mb: 2 }}
        noOptionsText="Nenhuma"
        freeSolo
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.keys(SKILLS_BY_AREA).map(cat => (
          <button
            key={cat}
            onClick={() => {
              const missing = SKILLS_BY_AREA[cat].filter(s => !skills.includes(s.toLowerCase()));
              if (missing.length > 0) onAddMany(missing);
            }}
            style={{
              border: '1px solid #334155', background: 'transparent',
              fontWeight: 700, fontSize: '0.55rem', textTransform: 'uppercase',
              letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace',
              padding: '2px 8px', cursor: 'pointer', color: '#64748b',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ccff00'; e.currentTarget.style.color = '#ccff00'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b'; }}
          >
            + {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32 }} role="list" aria-label="Skills adicionadas">
        {skills.length === 0 ? (
          <p style={{ color: '#94a3b8', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', margin: 0 }}>
            Nenhuma skill ainda. Use o campo acima, adicione por área ou faça upload do currículo.
          </p>
        ) : (
          skills.map(skill => (
            <span
              key={skill}
              role="listitem"
              style={{
                border: '2px solid #020617', padding: '2px 8px', fontWeight: 700,
                fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em',
                fontFamily: 'ui-monospace, monospace', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {skill}
              <button
                onClick={() => onRemove(skill)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, padding: 0, fontSize: '0.7rem', color: '#64748b' }}
                aria-label={`Remover ${skill}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
