'use client';

import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, TextField, Button, Chip, Alert,
  Slider, Select, MenuItem, FormControl, InputLabel, Paper, Snackbar,
} from '@mui/material';
import { useSession } from 'next-auth/react';

const SENIORITY_LEVELS = ['junior', 'pleno', 'senior', 'lead', 'manager', 'head', 'director'];

export default function PerfilPage() {
  const { data: session } = useSession();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [seniority, setSeniority] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [resumeText, setResumeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

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
        setSnackbar({ message: 'Perfil salvo!', severity: 'success' });
      } else {
        setSnackbar({ message: 'Erro ao salvar', severity: 'error' });
      }
    } catch {
      setSnackbar({ message: 'Erro ao salvar', severity: 'error' });
    }
    setSaving(false);
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
          SKILLS
        </Typography>

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
          {skills.map(skill => (
            <Chip
              key={skill}
              label={skill}
              onDelete={() => removeSkill(skill)}
              variant="outlined"
              color="primary"
              size="small"
            />
          ))}
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

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          CURRÍCULO
        </Typography>
        <TextField
          multiline
          rows={8}
          fullWidth
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Cole o texto do seu currículo aqui..."
          sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          O texto será usado para extrair skills automaticamente no futuro.
        </Typography>
      </Paper>

      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={handleSave}
        disabled={saving}
        sx={{ px: 6 }}
      >
        {saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
      </Button>

      {snackbar && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      )}
    </Container>
  );
}
