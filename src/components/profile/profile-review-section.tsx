'use client';

import { useState } from 'react';
import { Autocomplete, TextField, Select, MenuItem, FormControl, InputLabel, Slider, Chip } from '@mui/material';
import { ProfileAIPreview } from './profile-ai-preview';

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

interface FieldInfo {
  isFromResume: boolean;
  isOverridden: boolean;
}

interface Props {
  skills: string[];
  currentRole: string;
  seniority: string;
  area: string;
  experienceYears: number;
  education: string[];
  profileSource: 'linkedin' | 'manual' | null;
  fieldOverrides: Set<string>;
  onFieldChange: (field: string, value: any) => void;
  onAddSkill: (skill: string) => void;
  onAddSkills: (skills: string[]) => void;
  onRemoveSkill: (skill: string) => void;
  onRevertField: (field: string) => void;
}

function SourceBadge({ info }: { info: FieldInfo }) {
  if (info.isOverridden) {
    return (
      <span style={{ fontSize: '0.55rem', fontFamily: 'ui-monospace, monospace', color: '#ccff00', fontWeight: 700, marginLeft: 6 }}>
        EDITADO
      </span>
    );
  }
  if (info.isFromResume) {
    return (
      <span style={{ fontSize: '0.55rem', fontFamily: 'ui-monospace, monospace', color: '#94a3b8', marginLeft: 6 }}>
        do currículo
      </span>
    );
  }
  return null;
}

export function ProfileReviewSection({
  skills, currentRole, seniority, area, experienceYears, education,
  profileSource, fieldOverrides, onFieldChange, onAddSkill, onAddSkills, onRemoveSkill, onRevertField,
}: Props) {
  const isLinkedin = profileSource === 'linkedin';
  const fieldInfo = (field: string): FieldInfo => ({
    isFromResume: isLinkedin,
    isOverridden: fieldOverrides.has(field),
  });

  const [bulkSkillsInput, setBulkSkillsInput] = useState('');

  function handleBulkSkillsSubmit() {
    const newSkills = bulkSkillsInput.split(',').map(s => s.trim()).filter(Boolean);
    if (newSkills.length > 0) {
      onAddSkills(newSkills);
      setBulkSkillsInput('');
    }
  }

  return (
    <>
      {/* SKILLS */}
      <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: 0 }}>
            SKILLS {skills.length > 0 && <span style={{ border: '2px solid #020617', padding: '1px 6px', fontSize: '0.6rem', marginLeft: 8 }}>{skills.length}</span>}
          </h3>
          <SourceBadge info={fieldInfo('skills')} />
        </div>

        <label htmlFor="skill-autocomplete" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
          Adicionar skill
        </label>
        <Autocomplete
          id="skill-autocomplete"
          options={ALL_SUGGESTED_SKILLS.filter(s => !skills.includes(s.toLowerCase()))}
          onChange={(_, value) => { if (value) onAddSkill(value); }}
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

        <TextField
          label="Ou adicionar múltiplas skills"
          placeholder="Python, SQL, Spark, Airflow"
          value={bulkSkillsInput}
          onChange={(e) => setBulkSkillsInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleBulkSkillsSubmit();
            }
          }}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
          helperText="Separadas por vírgula, pressione Enter para adicionar"
          slotProps={{ input: { sx: { fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' } } }}
        />

        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32 }} role="list" aria-label="Skills adicionadas">
          {skills.length === 0 ? (
            <p style={{ color: '#94a3b8', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', margin: 0 }}>
              Nenhuma skill ainda.
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
                  onClick={() => onRemoveSkill(skill)}
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

      {/* EXPERIÊNCIA */}
      <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: 0 }}>
            EXPERIÊNCIA
          </h3>
          <SourceBadge info={fieldInfo('currentRole')} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="current-role" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
              Cargo atual
            </label>
            <SourceBadge info={fieldInfo('currentRole')} />
          </div>
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
          <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
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

          <FormControl sx={{ minWidth: 160, flex: 1 }} size="small">
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

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }} id="years-label">
              Anos de experiência: {experienceYears}
            </p>
            <SourceBadge info={fieldInfo('experienceYears')} />
          </div>
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
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', marginBottom: 6 }}>
                Formação
              </p>
              <SourceBadge info={fieldInfo('education')} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {education.map((edu, i) => (
                <Chip key={i} label={edu} size="small" sx={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview da IA */}
      <ProfileAIPreview
        seniority={seniority}
        area={area}
        skills={skills}
        experienceYears={experienceYears}
        currentRole={currentRole}
      />
    </>
  );
}
