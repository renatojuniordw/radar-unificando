'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container, Typography, Box,
  Slider, Select, MenuItem, FormControl, InputLabel,
  Autocomplete, TextField, Chip,
} from '@mui/material';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/hooks/useSnackbar';

const SENIORITY_LEVELS = ['junior', 'pleno', 'senior', 'lead', 'manager', 'head', 'director'];
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

export default function PerfilPage() {
  const { data: session } = useSession();
  const { show: showSnackbar } = useSnackbar();
  const [skills, setSkills] = useState<string[]>([]);
  const [seniority, setSeniority] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [currentRole, setCurrentRole] = useState('');
  const [area, setArea] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (data) {
        setSkills(data.skills || []);
        setSeniority(data.seniority || '');
        setExperienceYears(data.experienceYears || 0);
        setResumeText(data.resumeText || '');
        const parsed = data.parsedData || {};
        setCurrentRole(parsed.currentRole || '');
        setArea(parsed.area || '');
      }
    }).catch(() => {});
  }, []);

  function addSkill(skill: string) {
    const s = skill.trim().toLowerCase();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter(s => s !== skill));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = { skills, seniority, experienceYears, currentRole, area, resumeText };
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const parts = [`${skills.length} skills`, seniority && `Senioridade`, experienceYears > 0 && `${experienceYears}anos`, currentRole && `Cargo`, area && `Área`].filter(Boolean);
        showSnackbar(`Perfil salvo! (${parts.join(' · ')})`, 'success');
      } else {
        showSnackbar('Erro ao salvar', 'error');
      }
    } catch {
      showSnackbar('Erro ao salvar', 'error');
    }
    setSaving(false);
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
        if (data.seniority) setSeniority(data.seniority);
        if (data.experience) setExperienceYears(data.experience);
        showSnackbar(`Currículo processado! ${data.count} skills encontradas`, 'success');
      } else {
        const err = await res.json();
        showSnackbar(err.error || 'Erro ao processar currículo', 'error');
      }
    } catch {
      showSnackbar('Erro ao processar arquivo', 'error');
    }
    setExtracting(false);
  }

  async function handlePasteExtract() {
    if (!resumeText || resumeText.trim().length < 20) {
      showSnackbar('Cole o currículo primeiro (mínimo 20 caracteres)', 'error');
      return;
    }
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('text', resumeText);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
        if (data.seniority) setSeniority(data.seniority);
        if (data.experience) setExperienceYears(data.experience);
        showSnackbar(`${data.count} skills extraídas do texto!`, 'success');
      } else {
        const err = await res.json();
        showSnackbar(err.error || 'Erro ao extrair skills', 'error');
      }
    } catch {
      showSnackbar('Erro ao extrair skills', 'error');
    }
    setExtracting(false);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, []);

  const profileScore = [
    skills.length >= 3,
    !!seniority,
    experienceYears > 0,
    !!currentRole,
    !!area,
    (resumeText?.length || 0) > 50,
  ].filter(Boolean).length;

  const profilePercent = Math.round((profileScore / 6) * 100);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        MEU PERFIL
      </Typography>
      <Typography sx={{ mb: 3, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {session?.user?.email}
      </Typography>

      <Typography sx={{ mb: 3, fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, maxWidth: 560 }}>
        Quanto mais completo seu perfil, melhor o match com as vagas certas.
        Adicione suas skills, experiência e currículo para calcular a compatibilidade.
      </Typography>

      {/* Match Preview */}
      <div className="card-brutalist" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '4px solid', borderColor: profilePercent >= 80 ? '#16a34a' : '#ccff00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.85rem', color: '#020617',
              backgroundColor: profilePercent >= 80 ? '#16a34a' : '#ccff00',
            }}>
              {profilePercent}%
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Perfil {profilePercent >= 80 ? 'completo' : profilePercent >= 50 ? 'em andamento' : 'incompleto'}
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>
                {profileScore} de 6 itens preenchidos
              </div>
            </div>
          </div>
          <div style={{ height: 4, background: '#e2e8f0' }}>
            <div style={{ height: '100%', width: `${profilePercent}%`, backgroundColor: profilePercent >= 80 ? '#16a34a' : '#ccff00', transition: 'width 0.3s' }} />
          </div>
          {skills.length > 0 && (
            <Link href="/match" style={{
              display: 'inline-block', marginTop: 10,
              fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase',
              letterSpacing: '0.02em', color: '#020617',
              fontFamily: 'ui-monospace, monospace',
              textDecoration: 'underline',
            }}>
              Ver match com vagas →
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

      {/* Skills */}
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
          onChange={(_, value) => { if (value) addSkill(value); }}
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

        {/* Quick-add by area */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          {Object.keys(SKILLS_BY_AREA).map(cat => (
            <button
              key={cat}
              onClick={() => {
                const missing = SKILLS_BY_AREA[cat].filter(s => !skills.includes(s.toLowerCase()));
                if (missing.length > 0) setSkills([...skills, ...missing.map(s => s.toLowerCase())]);
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
                  onClick={() => removeSkill(skill)}
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

      {/* Experiência */}
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
            onChange={e => setCurrentRole(e.target.value)}
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
              onChange={e => setSeniority(e.target.value)}
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
              onChange={e => setArea(e.target.value)}
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
            onChange={(_, v) => setExperienceYears(v as number)}
            min={0}
            max={30}
            step={1}
            marks
            valueLabelDisplay="auto"
            aria-labelledby="years-label"
          />
        </div>
      </div>

      {/* Currículo */}
      <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: '0 0 16px' }}>
          CURRÍCULO
        </h3>
        <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Envie seu currículo para extrair skills automaticamente com IA.
        </p>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `4px dashed ${dragOver ? '#ccff00' : '#020617'}`,
            backgroundColor: dragOver ? 'rgba(204, 255, 0, 0.05)' : '#f8fafc',
            padding: 32,
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: 16,
            transition: 'all 0.2s',
          }}
          role="button"
          tabIndex={0}
          aria-label="Arraste seu currículo ou clique para selecionar"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.txt,.doc,.docx"
            onChange={e => handleFileUpload(e.target.files)}
            disabled={extracting}
          />
          <p style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', color: dragOver ? '#ccff00' : '#020617', margin: 0 }}>
            {dragOver ? 'SOLTE O ARQUIVO AQUI' : 'Arraste PDF ou clique para enviar'}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.6rem', fontFamily: 'ui-monospace, monospace', margin: '4px 0 0' }}>
            PDF · TXT · DOC · DOCX
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={handlePasteExtract}
            disabled={extracting || !resumeText}
            style={{
              border: '2px solid #020617', background: 'none', fontWeight: 900,
              padding: '10px 20px', cursor: extracting || !resumeText ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              fontFamily: 'ui-monospace, monospace', opacity: extracting || !resumeText ? 0.5 : 1,
            }}
          >
            EXTRAIR SKILLS DO TEXTO
          </button>
        </div>

        {extracting && (
          <div style={{ marginBottom: 16 }} role="status" aria-live="polite">
            <div style={{ height: 4, background: '#334155' }}>
              <div style={{ height: '100%', width: '60%', background: '#ccff00', animation: 'pulse-glow 1s infinite' }} />
            </div>
            <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', margin: '4px 0 0' }}>
              Extraindo skills com IA...
            </p>
          </div>
        )}

        <label htmlFor="resume-text" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
          Ou cole o texto do currículo
        </label>
        <textarea
          id="resume-text"
          rows={8}
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Cole aqui o texto do seu currículo (ex: LinkedIn export) e clique em EXTRAIR SKILLS DO TEXTO."
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '4px solid #020617',
            padding: 12,
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            boxShadow: '4px 4px 0px #000',
            resize: 'vertical',
          }}
          aria-describedby="resume-hint"
        />
        <p id="resume-hint" style={{ color: '#94a3b8', fontSize: '0.6rem', fontFamily: 'ui-monospace, monospace', margin: '4px 0 0' }}>
          Mínimo de 20 caracteres para extração.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-neon"
        style={{ padding: '14px 48px', fontSize: '0.8rem', width: '100%' }}
      >
        {saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
      </button>
    </Container>
  );
}
