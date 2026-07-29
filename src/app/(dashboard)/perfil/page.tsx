'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, TextField, Button, Chip, Alert,
  Slider, Select, MenuItem, FormControl, InputLabel, Paper, LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        MEU PERFIL
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {session?.user?.email}
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          CURRÍCULO
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={extracting}
          >
            {extracting ? 'EXTRAINDO...' : 'UPLOAD PDF'}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.txt,.doc,.docx"
              onChange={e => handleFileUpload(e.target.files)}
            />
          </Button>

          <Button
            variant="outlined"
            onClick={handlePasteExtract}
            disabled={extracting || !resumeText}
            startIcon={<AutoAwesomeIcon />}
          >
            EXTRAIR SKILLS DO TEXTO
          </Button>
        </Box>

        {extracting && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary">
              Extraindo skills com AI...
            </Typography>
          </Box>
        )}

        <TextField
          multiline
          rows={8}
          fullWidth
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Cole o texto do seu currículo aqui (LinkedIn export) ou faça upload do PDF acima."
          sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            SKILLS {skills.length > 0 && <Chip label={skills.length} size="small" sx={{ ml: 1 }} />}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            placeholder="Ex: Python, SQL, Power BI"
            sx={{ flex: 1 }}
          />
          <Button variant="contained" size="small" onClick={addSkill}>
            ADICIONAR
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {skills.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              Nenhuma skill ainda. Faça upload do currículo ou adicione manualmente.
            </Typography>
          ) : (
            skills.map(skill => (
              <Chip
                key={skill}
                label={skill}
                onDelete={() => removeSkill(skill)}
                variant="outlined"
                color="primary"
                size="small"
              />
            ))
          )}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          EXPERIÊNCIA
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Senioridade</InputLabel>
          <Select
            value={seniority}
            label="Senioridade"
            onChange={e => setSeniority(e.target.value)}
          >
            {SENIORITY_LEVELS.map(level => (
              <MenuItem key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography gutterBottom>Anos de experiência: {experienceYears}</Typography>
        <Slider
          value={experienceYears}
          onChange={(_, v) => setExperienceYears(v as number)}
          min={0}
          max={30}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </Paper>

      <Button
        variant="contained"
        size="large"
        onClick={handleSave}
        disabled={saving}
        sx={{ px: 6 }}
      >
        {saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
      </Button>
    </Container>
  );
}
