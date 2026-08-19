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

interface UploadJobResponse {
  status: 'processing' | 'completed' | 'failed';
  result?: UploadResponse;
  error?: string;
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
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
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

  /**
   * Faz polling do status do job de upload até completar ou falhar.
   * Retorna o resultado (UploadResponse) quando completo, ou null se o
   * job falhou/timeout. Lança erro com a mensagem do servidor quando falha.
   */
  async function pollUploadJob(jobId: string): Promise<UploadResponse | null> {
    const BASE_INTERVAL_MS = 1000;
    const MAX_INTERVAL_MS = 4000;
    const MAX_ATTEMPTS = 30; // ~50s total com backoff
    const TOTAL_TIMEOUT_MS = 60_000;
    const startTime = Date.now();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const delay = Math.min(BASE_INTERVAL_MS * Math.pow(1.5, attempt), MAX_INTERVAL_MS);
      await new Promise(r => setTimeout(r, delay));

      if (Date.now() - startTime > TOTAL_TIMEOUT_MS) return null;

      let statusRes: Response;
      try {
        statusRes = await fetch(`/api/upload/${jobId}`, { cache: 'no-store' });
      } catch {
        continue; // erro de rede transitório — tenta de novo
      }

      if (!statusRes.ok) {
        const err = await statusRes.json().catch(() => null);
        throw new Error(err?.error || 'Erro ao consultar o processamento');
      }

      const job: UploadJobResponse = await statusRes.json();
      if (job.status === 'completed' && job.result) {
        return job.result;
      }
      if (job.status === 'failed') {
        throw new Error(job.error || 'Falha ao extrair skills via IA');
      }
      // status === 'processing' → continua o loop
    }

    return null;
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

      // Timeout explícito: a extração via LLM pode levar ~30-90s. Sem isso o usuário
      // ficaria esperando para sempre se o servidor travar ou o nginx cortar a conexão.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);

      let res: Response;
      try {
        res = await fetch('/api/upload', { method: 'POST', body: formData, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error || 'Erro ao processar' };
      }

      // Fluxo assíncrono: o POST retorna o jobId na hora e a extração roda em
      // background. Fazemos polling do status até completar ou falhar.
      const { jobId } = await res.json() as { jobId: string };

      const data = await pollUploadJob(jobId);
      if (!data) {
        return { success: false, error: 'A extração demorou mais que o esperado. Tente novamente ou cole o texto do currículo diretamente.' };
      }

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
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      const knownError = err instanceof Error && err.message !== 'Failed to fetch';
      if (isTimeout) return { success: false, error: 'O processamento demorou demais. Tente novamente.' };
      if (knownError && err.message !== 'Erro de conexão') return { success: false, error: err.message };
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
    loading,
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
