'use client';

import { useState, useEffect, useCallback } from 'react';

function normalizeSkill(s: string): string {
  return s.trim().toLowerCase().replace(/[\s-]+/g, ' ');
}

interface ProfileData {
  skills: string[];
  seniority: string;
  experienceYears: number;
  currentRole: string;
  area: string;
  education: string[];
  resumeText: string;
  resumeMarkdown: string | null;
}

interface UploadResponse {
  skills: string[];
  experience: number | null;
  seniority: string | null;
  education: string[];
  markdown: string;
  resumeText: string;
  count: number;
}

const INITIAL_STATE: ProfileData = {
  skills: [],
  seniority: '',
  experienceYears: 0,
  currentRole: '',
  area: '',
  education: [],
  resumeText: '',
  resumeMarkdown: null,
};

export function useProfile() {
  const [state, setState] = useState<ProfileData>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoadError(null);
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        setLoadError('Sessão expirada. Faça login novamente.');
        return;
      }
      if (!res.ok) {
        setLoadError('Erro ao carregar perfil. Tente novamente.');
        return;
      }
      const data = await res.json();
      if (data) {
        setState({
          skills: data.skills || [],
          seniority: data.seniority || '',
          experienceYears: data.experienceYears || 0,
          currentRole: data.currentRole || '',
          area: data.area || '',
          education: data.education || [],
          resumeText: data.resumeText || '',
          resumeMarkdown: data.resumeMarkdown || null,
        });
      }
    } catch {
      setLoadError('Erro de conexão. Verifique sua internet.');
    }
  }

  const setField = useCallback(<K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  function addSkill(skill: string) {
    const normalized = normalizeSkill(skill);
    if (normalized && !state.skills.includes(normalized)) {
      setState(prev => ({ ...prev, skills: [...prev.skills, normalized] }));
    }
  }

  function addSkills(skills: string[]) {
    const normalized = skills.map(normalizeSkill).filter(s => s && !state.skills.includes(s));
    if (normalized.length > 0) {
      setState(prev => ({ ...prev, skills: [...prev.skills, ...normalized] }));
    }
  }

  function removeSkill(skill: string) {
    setState(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        skills: state.skills,
        seniority: state.seniority,
        experienceYears: state.experienceYears,
        currentRole: state.currentRole,
        area: state.area,
        education: state.education,
        resumeText: state.resumeText,
        resumeMarkdown: state.resumeMarkdown,
      };
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Erro ao salvar' };
      }
    } catch {
      return { success: false, error: 'Erro ao salvar' };
    } finally {
      setSaving(false);
    }
  }

  async function extractFromResume(input: File | string) {
    setExtracting(true);
    try {
      const formData = new FormData();
      if (input instanceof File) {
        formData.append('file', input);
      } else {
        if (input.trim().length < 20) {
          return { success: false, error: 'Cole o currículo primeiro (mínimo 20 caracteres)' };
        }
        formData.append('text', input);
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data: UploadResponse = await res.json();
        setState(prev => ({
          ...prev,
          skills: data.skills || [],
          seniority: data.seniority || prev.seniority,
          experienceYears: data.experience || prev.experienceYears,
          education: data.education || [],
          resumeMarkdown: data.markdown || prev.resumeMarkdown,
          resumeText: data.resumeText || prev.resumeText,
        }));
        const label = input instanceof File ? 'Currículo processado' : 'Skills extraídas do texto';
        return { success: true, message: `${label}! ${data.count} skills encontradas` };
      } else {
        const err = await res.json();
        return { success: false, error: err.error || 'Erro ao processar' };
      }
    } catch {
      return { success: false, error: 'Erro de conexão' };
    } finally {
      setExtracting(false);
    }
  }

  const completionScore = [
    state.skills.length >= 3,
    !!state.seniority,
    state.experienceYears > 0,
    !!state.currentRole,
    !!state.area,
    (state.resumeText?.length || 0) > 50,
  ].filter(Boolean).length;

  const completionPercent = Math.round((completionScore / 6) * 100);

  return {
    ...state,
    setField,
    addSkill,
    addSkills,
    removeSkill,
    saving,
    extracting,
    loadError,
    dragOver,
    setDragOver,
    handleSave,
    extractFromResume,
    loadProfile,
    completionScore,
    completionPercent,
  };
}
