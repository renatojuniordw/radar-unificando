'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Container } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useProfile, type ProfileField, type ProfileData } from '@/hooks/useProfile';
import { ProfileCompletionCard } from '@/components/profile/profile-completion-card';
import { ProfileImportSection } from '@/components/profile/profile-import-section';
import { ProfileReviewSection } from '@/components/profile/profile-review-section';
import { AtsAnalysisSection } from '@/components/profile/ats-analysis-section';
import { ArrowLeft, Loader2 } from 'lucide-react';

function getInitial(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || 'U';
  return source[0]?.toUpperCase() || 'U';
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { show: showSnackbar } = useSnackbar();
  const profile = useProfile();
  const [showManualForm, setShowManualForm] = useState(false);
  const importRef = useRef<HTMLDivElement>(null);

  const hasResume = !!(profile.resumeText || profile.resumeMarkdown);
  const hasData = hasResume || profile.skills.length > 0;
  const isSetup = !hasData && !showManualForm;

  const { setField } = profile;

  const handleFieldChange = useCallback((field: ProfileField, value: ProfileData[ProfileField]) => {
    setField(field, value);
  }, [setField]);

  async function handleSave() {
    const result = await profile.handleSave();
    if (result.success) {
      showSnackbar('Perfil salvo com sucesso!', 'success');
    } else {
      showSnackbar(result.error || 'Erro ao salvar', 'error');
    }
  }

  async function handleExtract(input: File | string) {
    const result = await profile.extractFromResume(input);
    if (result.success) {
      showSnackbar(result.message || 'Extraído com sucesso!', 'success');
    } else {
      showSnackbar(result.error || 'Erro ao extrair', 'error');
    }
  }

  function handleStartImport() {
    setShowManualForm(true);
    // Revela o formulário e rola até a área de importação de currículo
    requestAnimationFrame(() => {
      importRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleStartManual() {
    setShowManualForm(true);
  }

  const checks = [
    { label: 'Skills (mín. 3)', done: profile.skills.length >= 3 },
    { label: 'Senioridade', done: !!profile.seniority },
    { label: 'Experiência', done: profile.experienceYears > 0 },
    { label: 'Cargo atual', done: !!profile.currentRole },
    { label: 'Área', done: !!profile.area },
    { label: 'Currículo importado', done: (profile.resumeText?.length || 0) > 50 },
  ];

  const displayName = session?.user?.name?.trim() || session?.user?.email || 'Usuário';
  const initial = getInitial(session?.user?.name, session?.user?.email);

  // Estado de carregamento: skeleton evita o flash do estado vazio
  if (profile.loading) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Carregando perfil">
          <div className="h-12 w-12 rounded-full bg-slate-200" />
          <div className="h-8 w-48 bg-slate-200" />
          <div className="h-4 w-64 bg-slate-200" />
          <div className="h-24 bg-slate-200" />
          <div className="h-40 bg-slate-200" />
          <div className="h-40 bg-slate-200" />
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Link de voltar */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 no-underline mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para vagas
      </Link>

      {/* Cabeçalho da página */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 shrink-0 rounded-full bg-[#ccff00] border-4 border-[#020617] flex items-center justify-center text-[#020617] font-black text-lg shadow-[3px_3px_0px_#000]">
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="font-black uppercase tracking-tight text-2xl leading-none m-0">
            Meu Perfil
          </h1>
          <p className="m-0 font-mono text-[0.7rem] uppercase tracking-wider text-slate-500 truncate">
            {displayName}
          </p>
        </div>
      </div>

      {profile.loadError && (
        <div className="card-brutalist" style={{ padding: 16, marginBottom: 24, borderColor: '#dc2626', background: '#fef2f2' }} role="alert">
          <p style={{ color: '#dc2626', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', margin: 0 }}>
            {profile.loadError}
          </p>
          <button
            onClick={() => profile.loadProfile()}
            style={{
              marginTop: 8, border: '2px solid #dc2626', background: 'none',
              fontWeight: 700, padding: '4px 12px', cursor: 'pointer',
              fontSize: '0.65rem', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado setup: sem perfil */}
      {isSetup && (
        <div className="card-brutalist" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '4px solid #ccff00', backgroundColor: '#ccff00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#020617" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '-0.01em', margin: '0 0 8px' }}>
            CRIE SEU PERFIL
          </h3>
          <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Importe seu currículo do LinkedIn para extrair automaticamente skills, experiência e formação.
          </p>
          <button
            onClick={handleStartImport}
            style={{
              backgroundColor: '#020617', color: '#ccff00', fontWeight: 900,
              padding: '12px 32px', border: '4px solid #020617',
              boxShadow: '4px 4px 0px #000', cursor: 'pointer',
              fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              fontFamily: 'ui-monospace, monospace', marginBottom: 12, display: 'block',
              width: '100%', maxWidth: 320, margin: '0 auto 12px',
            }}
          >
            IMPORTAR CURRÍCULO
          </button>
          <button
            onClick={handleStartManual}
            style={{
              background: 'none', border: '2px solid #020617', color: '#020617',
              fontWeight: 700, padding: '10px 24px', cursor: 'pointer',
              fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            Preencher manualmente
          </button>
        </div>
      )}

      {/* Estado com dados: formulário de edição */}
      {!isSetup && (
        <>
          <ProfileCompletionCard
            percent={profile.completionPercent}
            completedCount={profile.completionScore}
            totalCount={6}
            checks={checks}
          />

          {/* Upload de currículo (se não tem ou quer re-importar) */}
          {!hasResume && (
            <div ref={importRef}>
              <ProfileImportSection
                extracting={profile.extracting}
                dragOver={profile.dragOver}
                onDragOver={profile.setDragOver}
                onExtract={handleExtract}
              />
            </div>
          )}

          <ProfileReviewSection
            skills={profile.skills}
            currentRole={profile.currentRole}
            seniority={profile.seniority}
            area={profile.area}
            experienceYears={profile.experienceYears}
            education={profile.education}
            onFieldChange={handleFieldChange}
            onAddSkill={profile.addSkill}
            onAddSkills={profile.addSkills}
            onRemoveSkill={profile.removeSkill}
          />

          {hasResume && (
            <div ref={importRef}>
              <ProfileImportSection
                title="ATUALIZAR CURRÍCULO"
                extracting={profile.extracting}
                dragOver={profile.dragOver}
                onDragOver={profile.setDragOver}
                onExtract={handleExtract}
              />
            </div>
          )}

          {hasResume && <AtsAnalysisSection />}

          {/* Barra de salvamento */}
          <div className="sticky bottom-4 z-10" aria-live="polite">
            <button
              onClick={handleSave}
              disabled={profile.saving}
              aria-busy={profile.saving}
              className="btn-neon"
              style={{ padding: '14px 48px', fontSize: '0.8rem', width: '100%' }}
            >
              {profile.saving ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SALVANDO...
                </span>
              ) : (
                'SALVAR PERFIL'
              )}
            </button>
          </div>
        </>
      )}
    </Container>
  );
}