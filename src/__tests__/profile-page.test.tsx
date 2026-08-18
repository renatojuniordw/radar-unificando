// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { useSessionMock } = vi.hoisted(() => ({ useSessionMock: vi.fn() }));
const { useSnackbarMock } = vi.hoisted(() => ({ useSnackbarMock: vi.fn() }));
const { useProfileMock } = vi.hoisted(() => ({ useProfileMock: vi.fn() }));

vi.mock('next-auth/react', () => ({ useSession: useSessionMock }));
vi.mock('@/hooks/useSnackbar', () => ({ useSnackbar: useSnackbarMock }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: useProfileMock }));
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock('@/components/profile/profile-completion-card', () => ({
  ProfileCompletionCard: () => <div>COMPLETION CARD</div>,
}));
vi.mock('@/components/profile/profile-import-section', () => ({
  ProfileImportSection: () => <div>IMPORT SECTION</div>,
}));
vi.mock('@/components/profile/profile-review-section', () => ({
  ProfileReviewSection: () => <div>REVIEW SECTION</div>,
}));
vi.mock('@/components/profile/ats-analysis-section', () => ({
  AtsAnalysisSection: () => <div>ATS SECTION</div>,
}));
vi.mock('@/components/ui/confirm-dialog', () => ({
  ConfirmDialog: ({ open, onConfirm, onCancel, confirmLabel }: any) =>
    open ? (
      <div>
        <button onClick={onConfirm}>{confirmLabel}</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    ) : null,
}));

import ProfilePage from '@/app/(dashboard)/perfil/page';

function baseProfile(overrides: Record<string, unknown> = {}) {
  return {
    loading: false,
    loadError: null,
    resumeText: '',
    resumeMarkdown: '',
    skills: [],
    seniority: '',
    experienceYears: 0,
    currentRole: '',
    area: '',
    education: [],
    extracting: false,
    dragOver: false,
    saving: false,
    completionPercent: 0,
    completionScore: 0,
    setDragOver: vi.fn(),
    setField: vi.fn(),
    addSkill: vi.fn(),
    addSkills: vi.fn(),
    removeSkill: vi.fn(),
    handleSave: vi.fn().mockResolvedValue({ success: true }),
    extractFromResume: vi.fn().mockResolvedValue({ success: true }),
    loadProfile: vi.fn(),
    ...overrides,
  };
}

describe('ProfilePage', () => {
  const showSnackbar = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({ data: { user: { name: 'Maria Silva', email: 'maria@test.com' } } });
    useSnackbarMock.mockReturnValue({ show: showSnackbar });
    useProfileMock.mockReturnValue(baseProfile());
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should_render_loading_skeleton', () => {
    useProfileMock.mockReturnValue(baseProfile({ loading: true }));
    render(<ProfilePage />);
    expect(screen.getByLabelText('Carregando perfil')).toBeTruthy();
  });

  it('should_render_setup_state_when_no_data', () => {
    render(<ProfilePage />);
    expect(screen.getByText('CRIE SEU PERFIL')).toBeTruthy();
    expect(screen.getByText('IMPORTAR CURRÍCULO')).toBeTruthy();
    expect(screen.getByText('PREENCHER MANUALMENTE')).toBeTruthy();
  });

  it('should_show_manual_form_after_clicking_manual', () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText('PREENCHER MANUALMENTE'));
    expect(screen.getByText('COMPLETION CARD')).toBeTruthy();
    expect(screen.getByText('REVIEW SECTION')).toBeTruthy();
  });

  it('should_render_edit_state_with_resume', () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60), skills: ['Python'] }));
    render(<ProfilePage />);
    expect(screen.getByText('COMPLETION CARD')).toBeTruthy();
    expect(screen.getByText('REVIEW SECTION')).toBeTruthy();
    expect(screen.getByText('ATS SECTION')).toBeTruthy();
    expect(screen.getByText('SALVAR PERFIL')).toBeTruthy();
  });

  it('should_save_profile_and_show_success_snackbar', async () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60) }));
    render(<ProfilePage />);
    fireEvent.click(screen.getByText('SALVAR PERFIL'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Perfil salvo com sucesso!', 'success'));
  });

  it('should_show_error_snackbar_when_save_fails', async () => {
    useProfileMock.mockReturnValue(baseProfile({
      resumeMarkdown: 'x'.repeat(60),
      handleSave: vi.fn().mockResolvedValue({ success: false, error: 'Erro ao salvar' }),
    }));
    render(<ProfilePage />);
    fireEvent.click(screen.getByText('SALVAR PERFIL'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Erro ao salvar', 'error'));
  });

  it('should_export_data_and_show_success', async () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60) }));
    fetchMock.mockResolvedValue({ ok: true, blob: async () => new Blob(['{}']) });
    render(<ProfilePage />);
    fireEvent.click(screen.getByText('Exportar Meus Dados'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Dados exportados com sucesso!', 'success'));
    expect(fetchMock).toHaveBeenCalledWith('/api/export');
  });

  it('should_show_export_error_when_fetch_fails', async () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60) }));
    fetchMock.mockRejectedValue(new Error('network'));
    render(<ProfilePage />);
    fireEvent.click(screen.getByText('Exportar Meus Dados'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Erro ao exportar dados. Tente novamente.', 'error'));
  });

  it('should_delete_account_after_confirmation', async () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60) }));
    fetchMock.mockResolvedValue({ ok: true });
    render(<ProfilePage />);
    fireEvent.click(screen.getByText('Excluir Minha Conta'));
    fireEvent.click(screen.getByText('Sim, excluir minha conta'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/auth/account', { method: 'DELETE' }));
    expect(showSnackbar).toHaveBeenCalledWith('Conta excluída com sucesso.', 'success');
  });

  it('should_show_delete_error_when_request_fails', async () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60) }));
    fetchMock.mockRejectedValue(new Error('network'));
    render(<ProfilePage />);
    fireEvent.click(screen.getByText('Excluir Minha Conta'));
    fireEvent.click(screen.getByText('Sim, excluir minha conta'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Erro ao excluir conta. Tente novamente.', 'error'));
  });

  it('should_render_load_error_with_retry', () => {
    useProfileMock.mockReturnValue(baseProfile({ loadError: 'Falha ao carregar' }));
    render(<ProfilePage />);
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByText('Tentar novamente'));
    expect(useProfileMock().loadProfile).toHaveBeenCalled();
  });
});