'use client';

import { useState, useEffect, useCallback } from 'react';

function normalizeSkill(s: string): string {
  return s.trim().toLowerCase().replace(/[\s-]+/g, ' ');
}

export type ProfileField = 'skills' | 'seniority' | 'experienceYears' | 'currentRole' | 'area' | 'education';

export interface ProfileData {
  skills: string[];
  seniority: string;
  experienceYears: number;
  currentRole: string;
  area: string;
  education: string[];
  resumeText: string;
  resumeMarkdown: string | null;
  profileSource: 'linkedin' | 'manual' | null;
  fieldOverrides: Set<string>;
}

interface UploadResponse {
  skills: string[];
  experience: number | null;
  seniority: string | null;
  currentRole: string | null;
  area: string | null;
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
  profileSource: null,
  fieldOverrides: new Set(),
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
        const hasResume = !!(data.resumeText || data.resumeMarkdown);
        setState({
          skills: data.skills || [],
          seniority: data.seniority || '',
          experienceYears: data.experienceYears || 0,
          currentRole: data.currentRole || '',
          area: data.area || '',
          education: data.education || [],
          resumeText: data.resumeText || '',
          resumeMarkdown: data.resumeMarkdown || null,
          profileSource: data.profileSource || (hasResume ? 'linkedin' : 'manual'),
          fieldOverrides: new Set(),
        });
      }
    } catch {
      setLoadError('Erro de conexão. Verifique sua internet.');
    }
  }

  const setField = useCallback((key: ProfileField, value: ProfileData[ProfileField]) => {
    setState(prev => ({
      ...prev,
      [key]: value,
      fieldOverrides: new Set(prev.fieldOverrides).add(key),
    }));
  }, []);

  function addSkill(skill: string) {
    const normalized = normalizeSkill(skill);
    if (normalized && !state.skills.includes(normalized)) {
      setState(prev => ({
        ...prev,
        skills: [...prev.skills, normalized],
        fieldOverrides: new Set(prev.fieldOverrides).add('skills'),
      }));
    }
  }

  function addSkills(skills: string[]) {
    const normalized = skills.map(normalizeSkill).filter(s => s && !state.skills.includes(s));
    if (normalized.length > 0) {
      setState(prev => ({
        ...prev,
        skills: [...prev.skills, ...normalized],
        fieldOverrides: new Set(prev.fieldOverrides).add('skills'),
      }));
    }
  }

  function removeSkill(skill: string) {
    setState(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
      fieldOverrides: new Set(prev.fieldOverrides).add('skills'),
    }));
  }

  const revertField = useCallback((field: ProfileField) => {
    setState(prev => {
      const next = { ...prev };
      next.fieldOverrides = new Set(prev.fieldOverrides);
      next.fieldOverrides.delete(field);
      return next;
    });
  }, []);

  function revertAll() {
    setState(prev => ({ ...prev, fieldOverrides: new Set() }));
  }

  function setManualMode() {
    setState(prev => ({
      ...prev,
      profileSource: 'manual',
      fieldOverrides: new Set(),
    }));
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
        profileSource: state.profileSource,
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
        setState(prev => {
          const overrides = prev.fieldOverrides;
          return {
            ...prev,
            skills: overrides.has('skills') ? prev.skills : data.skills || prev.skills,
            seniority: overrides.has('seniority') ? prev.seniority : (data.seniority || prev.seniority),
            experienceYears: overrides.has('experienceYears') ? prev.experienceYears : (data.experience || prev.experienceYears),
            currentRole: overrides.has('currentRole') ? prev.currentRole : (data.currentRole || prev.currentRole),
            area: overrides.has('area') ? prev.area : (data.area || prev.area),
            education: overrides.has('education') ? prev.education : (data.education || prev.education),
            resumeMarkdown: data.markdown || prev.resumeMarkdown,
            resumeText: data.resumeText || prev.resumeText,
            profileSource: 'linkedin',
          };
        });
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
    revertField,
    revertAll,
    setManualMode,
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
