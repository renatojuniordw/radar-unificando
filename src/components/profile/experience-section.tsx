'use client';

import { Slider, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const SENIORITY_LEVELS = ['junior', 'pleno', 'senior', 'lead', 'manager', 'head', 'director'];
const AREA_OPTIONS = ['Dados', 'BI', 'Business', 'Growth', 'Engenharia', 'Produto', 'Outro'];

interface Props {
  currentRole: string;
  seniority: string;
  area: string;
  experienceYears: number;
  onCurrentRoleChange: (v: string) => void;
  onSeniorityChange: (v: string) => void;
  onAreaChange: (v: string) => void;
  onExperienceYearsChange: (v: number) => void;
}

export function ExperienceSection({
  currentRole, seniority, area, experienceYears,
  onCurrentRoleChange, onSeniorityChange, onAreaChange, onExperienceYearsChange,
}: Props) {
  return (
    <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
      <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: '0 0 16px' }}>
        EXPERIÊNCIA
      </h3>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="current-role" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
          Cargo atual
        </label>
        <input
          id="current-role"
          type="text"
          value={currentRole}
          onChange={e => onCurrentRoleChange(e.target.value)}
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
            onChange={e => onSeniorityChange(e.target.value)}
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
            onChange={e => onAreaChange(e.target.value)}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#020617', borderWidth: 2 } }}
          >
            {AREA_OPTIONS.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div>
        <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }} id="years-label">
          Anos de experiência: {experienceYears}
        </p>
        <Slider
          value={experienceYears}
          onChange={(_, v) => onExperienceYearsChange(v as number)}
          min={0}
          max={30}
          step={1}
          marks
          valueLabelDisplay="auto"
          aria-labelledby="years-label"
        />
      </div>
    </div>
  );
}
