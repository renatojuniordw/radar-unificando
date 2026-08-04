'use client';

import { memo } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Slider, Chip } from '@mui/material';
import { BaseCard } from '@/components/base-card';
import { SkillInput } from '@/components/profile/skill-input';
import type { ProfileField, ProfileData } from '@/hooks/useProfile';

const SENIORITY_LEVELS = ['junior', 'pleno', 'senior', 'lead', 'manager', 'head'];
const AREA_OPTIONS = ['Dados', 'BI', 'Business', 'Growth', 'Engenharia', 'Produto', 'Outro'];

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
  currentRole: string;
  seniority: string;
  area: string;
  experienceYears: number;
  education: string[];
  onFieldChange: (field: ProfileField, value: ProfileData[ProfileField]) => void;
  onAddSkill: (skill: string) => void;
  onAddSkills: (skills: string[]) => void;
  onRemoveSkill: (skill: string) => void;
}

export const ProfileReviewSection = memo(function ProfileReviewSection({
  skills, currentRole, seniority, area, experienceYears, education,
  onFieldChange, onAddSkill, onAddSkills, onRemoveSkill,
}: Props) {
  return (
    <>
      {/* SKILLS */}
      <BaseCard title={<>SKILLS {skills.length > 0 && (
        <span style={{ border: '2px solid #020617', padding: '1px 6px', fontSize: '0.6rem', marginLeft: 8 }}>{skills.length}</span>
      )}</>}>
        <SkillInput
          skills={skills}
          allSuggestions={ALL_SUGGESTED_SKILLS}
          areaSkills={SKILLS_BY_AREA[area] || []}
          onAddSkill={onAddSkill}
          onAddSkills={onAddSkills}
          onRemoveSkill={onRemoveSkill}
        />

        {/* Categorias rápidas */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
          {Object.keys(SKILLS_BY_AREA).map(cat => (
            <button
              key={cat}
              onClick={() => {
                const missing = SKILLS_BY_AREA[cat].filter(s => !skills.includes(s.toLowerCase()));
                if (missing.length > 0) onAddSkills(missing);
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
      </BaseCard>

      {/* DADOS PROFISSIONAIS */}
      <BaseCard title="DADOS PROFISSIONAIS">

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="current-role" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
            Cargo atual
          </label>
          <input
            id="current-role"
            type="text"
            value={currentRole}
            onChange={e => onFieldChange('currentRole', e.target.value)}
            placeholder="Ex: Analista de Dados Sênior"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '4px solid #020617', padding: '10px 12px',
              fontSize: '0.85rem', fontFamily: 'inherit',
              boxShadow: '2px 2px 0px #000',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 180 }, flex: 1 }} size="small">
            <InputLabel sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, textTransform: 'uppercase' }}>
              Senioridade
            </InputLabel>
            <Select
              value={seniority}
              label="Senioridade"
              onChange={e => onFieldChange('seniority', e.target.value)}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#020617', borderWidth: 2 } }}
            >
              {SENIORITY_LEVELS.map(level => (
                <MenuItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: { xs: '100%', sm: 160 }, flex: 1 }} size="small">
            <InputLabel sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, textTransform: 'uppercase' }}>
              Área
            </InputLabel>
            <Select
              value={area}
              label="Área"
              onChange={e => onFieldChange('area', e.target.value)}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#020617', borderWidth: 2 } }}
            >
              {AREA_OPTIONS.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div style={{ marginBottom: education.length > 0 ? 16 : 0 }}>
          <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }} id="years-label">
            Experiência: {experienceYears} {experienceYears === 1 ? 'ano' : 'anos'}
          </p>
          <Slider
            value={experienceYears}
            onChange={(_, v) => onFieldChange('experienceYears', v as number)}
            min={0}
            max={30}
            step={1}
            marks
            valueLabelDisplay="auto"
            aria-labelledby="years-label"
          />
        </div>

        {education.length > 0 && (
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', marginBottom: 6 }}>
              Formação
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {education.map((edu, i) => (
                <Chip key={i} label={edu} size="small" sx={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem' }} />
              ))}
            </div>
          </div>
        )}
      </BaseCard>
    </>
  );
});
