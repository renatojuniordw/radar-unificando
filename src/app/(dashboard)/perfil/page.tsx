'use client';

import { useState, useCallback } from 'react';
import { Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useProfile, type ProfileField, type ProfileData } from '@/hooks/useProfile';
import { ProfileCompletionCard } from '@/components/profile/profile-completion-card';
import { ProfileImportSection } from '@/components/profile/profile-import-section';
import { ProfileReviewSection } from '@/components/profile/profile-review-section';

export default function PerfilPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { show: showSnackbar } = useSnackbar();
  const profile = useProfile();
  const [showManualForm, setShowManualForm] = useState(false);

  const hasResume = !!(profile.resumeText || profile.resumeMarkdown);
  const hasData = hasResume || profile.skills.length > 0;
  const isSetup = !hasData && !showManualForm;

  const hasChanges = profile.fieldOverrides.size > 0 || (!profile.saving && hasData);

  const { setField } = profile;

  const handleFieldChange = useCallback((field: ProfileField, value: ProfileData[ProfileField]) => {
    setField(field, value);
  }, [setField]);

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
      router.push('/');
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
      <Typography variant="h1" sx={{ fontWeight: 900, mb: 0.5, textTransform: 'uppercase', letterSpacing: '-0.02em', fontSize: '2rem' }}>
        MEU PERFIL
      </Typography>
      <Typography sx={{ mb: 3, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {session?.user?.email}
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
            onClick={() => setShowManualForm(true)}
            style={{
              backgroundColor: '#020617', color: '#ccff00', fontWeight: 900,
              padding: '12px 32px', border: '4px solid #020617',
              boxShadow: '4px 4px 0px #000', cursor: 'pointer',
              fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              fontFamily: 'ui-monospace, monospace', marginBottom: 12, display: 'block',
              width: '100%', maxWidth: 320, margin: '0 auto 12px',
            }}
          >
            COMEÇAR
          </button>
          <button
            onClick={() => setShowManualForm(true)}
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
            skills={profile.skills}
          />

          {/* Upload de currículo (se não tem ou quer re-importar) */}
          {!hasResume && (
            <ProfileImportSection
              extracting={profile.extracting}
              dragOver={profile.dragOver}
              onDragOver={profile.setDragOver}
              onExtract={handleExtract}
            />
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
            <ProfileImportSection
              extracting={profile.extracting}
              dragOver={profile.dragOver}
              onDragOver={profile.setDragOver}
              onExtract={handleExtract}
            />
          )}

          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={profile.saving}
              className="btn-neon"
              style={{ padding: '14px 48px', fontSize: '0.8rem', width: '100%' }}
            >
              {profile.saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
            </button>
          )}
        </>
      )}
    </Container>
  );
}
