'use client';

import { Container, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useProfile } from '@/hooks/useProfile';
import { useChatAssistant } from '@/contexts/chat-assistant-context';
import { ProfileCompletionCard } from '@/components/profile/profile-completion-card';
import { SkillsSection } from '@/components/profile/skills-section';
import { ExperienceSection } from '@/components/profile/experience-section';
import { ResumeUploadSection } from '@/components/profile/resume-upload-section';

export default function PerfilPage() {
  const { data: session } = useSession();
  const { show: showSnackbar } = useSnackbar();
  const profile = useProfile();
  const { openWithPrompt } = useChatAssistant();

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
        Adicione suas skills, experiência e currículo.
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

      <SkillsSection
        skills={profile.skills}
        onAdd={profile.addSkill}
        onRemove={profile.removeSkill}
        onAddMany={profile.addSkills}
      />

      <ExperienceSection
        currentRole={profile.currentRole}
        seniority={profile.seniority}
        area={profile.area}
        experienceYears={profile.experienceYears}
        onCurrentRoleChange={v => profile.setField('currentRole', v)}
        onSeniorityChange={v => profile.setField('seniority', v)}
        onAreaChange={v => profile.setField('area', v)}
        onExperienceYearsChange={v => profile.setField('experienceYears', v)}
      />

      <ResumeUploadSection
        resumeText={profile.resumeText}
        onResumeTextChange={v => profile.setField('resumeText', v)}
        education={profile.education}
        resumeMarkdown={profile.resumeMarkdown}
        extracting={profile.extracting}
        dragOver={profile.dragOver}
        onDragOver={profile.setDragOver}
        onExtract={handleExtract}
      />

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
