'use client';

import { useState } from 'react';
import { Container, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useProfile } from '@/hooks/useProfile';
import { useChatAssistant } from '@/contexts/chat-assistant-context';
import { ProfileCompletionCard } from '@/components/profile/profile-completion-card';
import { ProfileImportSection } from '@/components/profile/profile-import-section';
import { ProfileReviewSection } from '@/components/profile/profile-review-section';
import { ProfileEmptyState } from '@/components/profile/profile-empty-state';

export default function PerfilPage() {
  const { data: session } = useSession();
  const { show: showSnackbar } = useSnackbar();
  const profile = useProfile();
  const { openWithPrompt } = useChatAssistant();
  const [showManualForm, setShowManualForm] = useState(false);

  const hasResume = !!(profile.resumeText || profile.resumeMarkdown);
  const isEmpty = !hasResume && !showManualForm && profile.skills.length === 0;

  async function handleSave() {
    const result = await profile.handleSave();
    if (result.success) {
      const parts = [
        `${profile.skills.length} skills`,
        profile.seniority && 'Senioridade',
        profile.experienceYears > 0 && `${profile.experienceYears}anos`,
        profile.currentRole && 'Cargo',
        profile.area && 'Área',
      ].filter(Boolean);
      showSnackbar(`Perfil salvo! (${parts.join(' · ')})`, 'success');
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        MEU PERFIL
      </Typography>
      <Typography sx={{ mb: 3, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {session?.user?.email}
      </Typography>

      <Typography sx={{ mb: 3, fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, maxWidth: 560 }}>
        Perfil completo ajuda o assistente e as recomendações a te conhecerem melhor.
        Importe seu currículo do LinkedIn para preencher automaticamente.
      </Typography>

      {profile.loadError && (
        <div className="card-brutalist" style={{ padding: 16, marginBottom: 24, borderColor: '#dc2626', background: '#fef2f2' }}>
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

      {/* Estado vazio: sem perfil nenhum */}
      {isEmpty && (
        <ProfileEmptyState
          onImportClick={() => {
            const el = document.getElementById('profile-import-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onManualClick={() => setShowManualForm(true)}
        />
      )}

      {/* Sem currículo mas com dados manuais ou modo manual */}
      {!hasResume && showManualForm && (
        <ProfileImportSection
          extracting={profile.extracting}
          dragOver={profile.dragOver}
          onDragOver={profile.setDragOver}
          onExtract={handleExtract}
        />
      )}

      {/* Com currículo: barra de progresso + CTA assistente */}
      {(hasResume || profile.skills.length > 0) && (
        <>
          <ProfileCompletionCard
            percent={profile.completionPercent}
            completedCount={profile.completionScore}
            totalCount={6}
            skills={profile.skills}
          />

          <button
            onClick={() => openWithPrompt('Analise meu perfil e me diga como estão minhas chances nas vagas disponíveis.')}
            style={{
              display: 'block', width: '100%', marginBottom: 24,
              border: '2px solid #020617', background: 'transparent',
              padding: '10px 16px', cursor: 'pointer', textAlign: 'left',
              fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
              letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace',
            }}
          >
            Peça pro assistente analisar seu perfil →
          </button>

          <ProfileReviewSection
            skills={profile.skills}
            currentRole={profile.currentRole}
            seniority={profile.seniority}
            area={profile.area}
            experienceYears={profile.experienceYears}
            education={profile.education}
            profileSource={profile.profileSource}
            fieldOverrides={profile.fieldOverrides}
            onFieldChange={(field, value) => profile.setField(field as any, value)}
            onAddSkill={profile.addSkill}
            onAddSkills={profile.addSkills}
            onRemoveSkill={profile.removeSkill}
            onRevertField={(field) => profile.revertField(field as any)}
          />

          {hasResume && (
            <div style={{ marginBottom: 24 }}>
              <ProfileImportSection
                extracting={profile.extracting}
                dragOver={profile.dragOver}
                onDragOver={profile.setDragOver}
                onExtract={handleExtract}
              />
            </div>
          )}
        </>
      )}

      {/* Modo manual sem currículo: formulário simplificado */}
      {!hasResume && showManualForm && (
        <ProfileReviewSection
          skills={profile.skills}
          currentRole={profile.currentRole}
          seniority={profile.seniority}
          area={profile.area}
          experienceYears={profile.experienceYears}
          education={profile.education}
          profileSource="manual"
          fieldOverrides={profile.fieldOverrides}
          onFieldChange={(field, value) => profile.setField(field as any, value)}
          onAddSkill={profile.addSkill}
          onAddSkills={profile.addSkills}
          onRemoveSkill={profile.removeSkill}
          onRevertField={() => {}}
        />
      )}

      <button
        onClick={handleSave}
        disabled={profile.saving}
        className="btn-neon"
        style={{ padding: '14px 48px', fontSize: '0.8rem', width: '100%' }}
      >
        {profile.saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
      </button>
    </Container>
  );
}
