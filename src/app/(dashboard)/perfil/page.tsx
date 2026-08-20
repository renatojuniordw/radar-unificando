'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useProfile, type ProfileField, type ProfileData } from '@/hooks/useProfile';
import { ProfileCompletionCard } from '@/components/profile/profile-completion-card';
import { ProfileImportSection } from '@/components/profile/profile-import-section';
import { ProfileReviewSection } from '@/components/profile/profile-review-section';
import { AtsAnalysisSection } from '@/components/profile/ats-analysis-section';
import { GeneratedResumesTab } from '@/components/profile/generated-resumes-tab';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, Loader2, User, Download, Trash2, FileText } from 'lucide-react';

function getInitial(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || 'U';
  return source[0]?.toUpperCase() || 'U';
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { show: showSnackbar } = useSnackbar();
  const profile = useProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'resumes'>('profile');
  const [showManualForm, setShowManualForm] = useState(false);
  const importRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Erro ao exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `radar-unificando-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSnackbar('Dados exportados com sucesso!', 'success');
    } catch {
      showSnackbar('Erro ao exportar dados. Tente novamente.', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      showSnackbar('Conta excluída com sucesso.', 'success');
      // Redireciona para a home após exclusão
      router.push('/');
    } catch {
      showSnackbar('Erro ao excluir conta. Tente novamente.', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
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
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#64748b] hover:text-[#020617] no-underline mb-6 transition-colors min-h-[44px]"
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

        {/* Navegação entre Abas */}
        <div className="flex gap-2 mb-6 border-b-2 border-[#020617] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#020617] cursor-pointer transition-all ${
              activeTab === 'profile'
                ? 'bg-[#ccff00] text-[#020617] shadow-[3px_3px_0px_#000]'
                : 'bg-white text-[#64748b] hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            Meu Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resumes')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#020617] cursor-pointer transition-all ${
              activeTab === 'resumes'
                ? 'bg-[#ccff00] text-[#020617] shadow-[3px_3px_0px_#000]'
                : 'bg-white text-[#64748b] hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Currículos Adaptados
          </button>
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

        {/* Conteúdo da Aba de Currículos Adaptados */}
        {activeTab === 'resumes' && <GeneratedResumesTab />}

        {/* Conteúdo da Aba de Perfil */}
        {activeTab === 'profile' && (
          <>
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
          </>
        )}

        {/* Gerenciamento de Conta (LGPD) */}
        <div className="mt-12 pt-8 border-t-2 border-slate-200">
          <h2 className="font-black text-sm uppercase tracking-wider text-[#64748b] mb-4">
            Gerenciamento de Conta
          </h2>
          <p className="text-[#94a3b8] text-xs font-mono mb-4">
            Em conformidade com a LGPD (Lei 13.709/2018), você pode exportar seus dados ou solicitar a exclusão da sua conta e todos os dados pessoais associados.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-2 border-[#020617] bg-white text-[#020617] hover:bg-slate-50 cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exportando...' : 'Exportar Meus Dados'}
            </button>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-2 border-red-600 bg-transparent text-red-600 hover:bg-red-50 cursor-pointer min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Minha Conta
            </button>
          </div>
        </div>

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Excluir minha conta"
          message="Esta ação é irreversível. Sua conta e todos os dados pessoais associados (perfil, currículo, histórico de chats, vagas salvas) serão permanentemente excluídos. Você tem certeza?"
          confirmLabel={deleting ? 'Excluindo...' : 'Sim, excluir minha conta'}
          cancelLabel="Cancelar"
          onConfirm={handleDeleteAccount}
          onCancel={() => setDeleteDialogOpen(false)}
          severity="error"
        />
      </Container>
    </div>
  );
}