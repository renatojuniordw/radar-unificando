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
import { ArrowLeft, Loader2, User } from 'lucide-react';

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

  if (profile.loading) {
    return (
      <div className="bg-white min-h-screen text-[#020617] py-6 sm:py-10">
        <Container maxWidth="md">
          <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Carregando perfil">
            <div className="h-12 w-12 rounded-full bg-slate-200" />
            <div className="h-8 w-48 bg-slate-200" />
            <div className="h-4 w-64 bg-slate-200" />
            <div className="h-24 bg-slate-200" />
            <div className="h-40 bg-slate-200" />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-[#ffffff] min-h-screen text-[#020617] py-6 sm:py-10">
      <Container maxWidth="md">
        {/* Link de voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#64748b] hover:text-[#020617] no-underline mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para vagas
        </Link>

        {/* Cabeçalho da página */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 shrink-0 rounded-full bg-[#ccff00] border-4 border-[#020617] flex items-center justify-center text-[#020617] font-black text-xl shadow-[3px_3px_0px_#000]">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="font-black uppercase tracking-tight text-2xl sm:text-3xl leading-none m-0 text-[#020617]">
              Meu Perfil
            </h1>
            <p className="m-0 font-mono text-xs uppercase tracking-wider text-[#64748b] truncate mt-1">
              {displayName}
            </p>
          </div>
        </div>

        {profile.loadError && (
          <div className="card-brutalist p-4 mb-6 border-red-600 bg-red-50 text-red-900" role="alert">
            <p className="font-mono text-xs font-bold m-0">
              {profile.loadError}
            </p>
            <button
              onClick={() => profile.loadProfile()}
              className="mt-2 border-2 border-red-700 bg-transparent font-mono text-xs font-black uppercase px-3 py-1 cursor-pointer text-red-900"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Estado setup: sem perfil */}
        {isSetup && (
          <div className="card-brutalist p-8 text-center mb-8">
            <div className="w-16 h-16 rounded-full border-4 border-[#020617] bg-[#ccff00] flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_#000]">
              <User className="w-8 h-8 text-[#020617] stroke-[2.5]" />
            </div>
            <h3 className="font-black text-xl uppercase tracking-tight text-[#020617] mb-2">
              CRIE SEU PERFIL
            </h3>
            <p className="text-[#64748b] font-mono text-xs mb-6 max-w-md mx-auto leading-relaxed font-bold">
              Importe seu currículo do LinkedIn em PDF para extrair automaticamente suas habilidades, experiências e nível de senioridade.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={handleStartImport}
                className="btn-neon w-full sm:w-auto px-6 py-3 text-xs font-mono font-black uppercase tracking-wider"
              >
                IMPORTAR CURRÍCULO
              </button>
              <button
                onClick={handleStartManual}
                className="btn-dark w-full sm:w-auto px-6 py-3 text-xs font-mono font-black uppercase tracking-wider"
              >
                PREENCHER MANUALMENTE
              </button>
            </div>
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

            {/* Botão Salvar Perfil */}
            <div className="mt-8 mb-4">
              <button
                onClick={handleSave}
                disabled={profile.saving}
                aria-busy={profile.saving}
                className="btn-neon w-full py-4 text-base font-mono font-black uppercase tracking-wider shadow-[8px_8px_0px_#000] border-4 border-[#020617]"
              >
                {profile.saving ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    SALVANDO PERFIL...
                  </span>
                ) : (
                  'SALVAR PERFIL'
                )}
              </button>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}