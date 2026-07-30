'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, Chip, Alert,
  Slider, Select, MenuItem, FormControl, InputLabel, LinearProgress,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/hooks/useSnackbar';

const SENIORITY_LEVELS = ['junior', 'pleno', 'senior', 'lead', 'manager', 'head', 'director'];

export default function PerfilPage() {
  const { data: session } = useSession();
  const { show: showSnackbar } = useSnackbar();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [seniority, setSeniority] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [resumeText, setResumeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (data) {
        setSkills(data.skills || []);
        setSeniority(data.seniority || '');
        setExperienceYears(data.experienceYears || 0);
        setResumeText(data.resumeText || '');
      }
    }).catch(() => {});
  }, []);

  function addSkill() {
    const s = skillInput.trim().toLowerCase();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter(s => s !== skill));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, seniority, experienceYears, resumeText }),
      });

      if (res.ok) {
        showSnackbar('Perfil salvo!', 'success');
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

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

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

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        MEU PERFIL
      </Typography>
      <Typography sx={{ mb: 4, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {session?.user?.email}
      </Typography>

      <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: '0 0 16px' }}>
          CURRÍCULO
        </h3>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <label style={{
            backgroundColor: '#020617', color: '#ccff00', fontWeight: 900,
            padding: '10px 20px', cursor: 'pointer', fontSize: '0.7rem',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            border: '2px solid #020617', fontFamily: 'ui-monospace, monospace',
            opacity: extracting ? 0.5 : 1,
          }}>
            {extracting ? 'EXTRAINDO...' : 'UPLOAD PDF'}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.txt,.doc,.docx"
              onChange={e => handleFileUpload(e.target.files)}
              disabled={extracting}
            />
          </label>

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
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 4, background: '#334155' }}>
              <div style={{ height: '100%', width: '60%', background: '#ccff00', animation: 'pulse-glow 1s infinite' }} />
            </div>
            <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', margin: '4px 0 0' }}>
              Extraindo skills com AI...
            </p>
          </div>
        )}

        <textarea
          rows={8}
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Cole o texto do seu currículo aqui (LinkedIn export) ou faça upload do PDF acima."
          style={{
            width: '100%',
            border: '4px solid #020617',
            padding: 12,
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            boxShadow: '4px 4px 0px #000',
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
        />
      </div>

      <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: 0 }}>
            SKILLS {skills.length > 0 && <span style={{ border: '2px solid #020617', padding: '1px 6px', fontSize: '0.6rem', marginLeft: 8 }}>{skills.length}</span>}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            placeholder="Ex: Python, SQL, Power BI"
            style={{
              flex: 1,
              border: '4px solid #020617',
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontFamily: 'inherit',
              boxShadow: '2px 2px 0px #000',
            }}
          />
          <button
            onClick={addSkill}
            className="btn-neon"
            style={{ padding: '8px 16px', fontSize: '0.6rem', whiteSpace: 'nowrap' }}
          >
            ADICIONAR
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {skills.length === 0 ? (
            <p style={{ color: '#94a3b8', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', margin: 0 }}>
              Nenhuma skill ainda. Faça upload do currículo ou adicione manualmente.
            </p>
          ) : (
            skills.map(skill => (
              <span
                key={skill}
                style={{
                  border: '2px solid #020617', padding: '2px 8px', fontWeight: 700,
                  fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em',
                  fontFamily: 'ui-monospace, monospace', display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, padding: 0, fontSize: '0.7rem' }}
                  aria-label={`Remover ${skill}`}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: '0 0 16px' }}>
          EXPERIÊNCIA
        </h3>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, textTransform: 'uppercase' }}>Senioridade</InputLabel>
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

        <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
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
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-neon"
        style={{ padding: '14px 48px', fontSize: '0.8rem' }}
      >
        {saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
      </button>
    </Container>
  );
}
