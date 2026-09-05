// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileTab } from '@/components/profile/profile-tab';

const { useProfileMock } = vi.hoisted(() => ({ useProfileMock: vi.fn() }));
const { useSnackbarMock } = vi.hoisted(() => ({ useSnackbarMock: vi.fn() }));

vi.mock('@/hooks/useProfile', () => ({ useProfile: useProfileMock }));
vi.mock('@/hooks/useSnackbar', () => ({ useSnackbar: useSnackbarMock }));
vi.mock('@/components/profile/profile-completion-card', () => ({
  ProfileCompletionCard: ({ percent, completedCount, totalCount, checks }: any) => (
    <div data-testid="mock-completion-card" data-percent={percent} data-completed={completedCount} data-total={totalCount}>
      {checks.map((c: any, i: number) => (
        <span key={i} data-testid="mock-check" data-label={c.label} data-done={String(c.done)}>
          {c.label}
        </span>
      ))}
    </div>
  ),
}));
vi.mock('@/components/profile/profile-import-section', () => ({
  ProfileImportSection: ({ title, onExtract }: any) => (
    <div data-testid="mock-import-section" data-title={title || ''}>
      <button onClick={() => onExtract(new File(['x'], 'cv.pdf', { type: 'application/pdf' }))}>EXTRACT FILE</button>
      <button onClick={() => onExtract('texto com mais de vinte caracteres para extrair')}>EXTRACT TEXT</button>
    </div>
  ),
}));
vi.mock('@/components/profile/profile-review-section', () => ({
  ProfileReviewSection: ({ onFieldChange }: any) => (
    <div data-testid="mock-review-section">
      <button onClick={() => onFieldChange('currentRole', 'Engenheiro')}>CHANGE ROLE</button>
    </div>
  ),
}));
vi.mock('@/components/profile/ats-analysis-section', () => ({
  AtsAnalysisSection: () => <div data-testid="mock-ats-section">ATS</div>,
}));
vi.mock('@/components/profile/outdated-profile-banner', () => ({
  OutdatedProfileBanner: ({ onStartImport }: any) => (
    <button type="button" data-testid="mock-update-banner-button" onClick={onStartImport}>
      ATUALIZAR AGORA
    </button>
  ),
}));

const showSnackbar = vi.fn();

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

beforeEach(() => {
  vi.clearAllMocks();
  useSnackbarMock.mockReturnValue({ show: showSnackbar });
  useProfileMock.mockReturnValue(baseProfile());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProfileTab', () => {
  it('should_render_loading_skeleton', () => {
    useProfileMock.mockReturnValue(baseProfile({ loading: true }));
    render(<ProfileTab />);
    expect(screen.getByLabelText('Carregando perfil')).toBeTruthy();
  });

  it('should_render_setup_state_when_no_data', () => {
    render(<ProfileTab />);
    expect(screen.getByText('CRIE SEU PERFIL')).toBeTruthy();
    expect(screen.getByText('IMPORTAR CURRÍCULO')).toBeTruthy();
    expect(screen.getByText('PREENCHER MANUALMENTE')).toBeTruthy();
    expect(screen.queryByTestId('mock-completion-card')).toBeNull();
  });

  it('should_show_edit_form_after_clicking_manual', () => {
    render(<ProfileTab />);
    fireEvent.click(screen.getByText('PREENCHER MANUALMENTE'));
    expect(screen.getByTestId('mock-completion-card')).toBeTruthy();
    expect(screen.getByTestId('mock-review-section')).toBeTruthy();
    expect(screen.queryByTestId('mock-ats-section')).toBeNull();
  });

  it('should_start_import_scrolling_to_import_section', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    let rafCb: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb;
      return 1;
    });
    render(<ProfileTab />);
    fireEvent.click(screen.getByText('IMPORTAR CURRÍCULO'));
    await waitFor(() => expect(screen.getByTestId('mock-completion-card')).toBeTruthy());
    (rafCb as FrameRequestCallback | null)?.(0);
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('should_start_import_from_outdated_banner', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    let rafCb: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb;
      return 1;
    });
    render(<ProfileTab />);
    fireEvent.click(screen.getByTestId('mock-update-banner-button'));
    await waitFor(() => expect(screen.getByTestId('mock-completion-card')).toBeTruthy());
    (rafCb as FrameRequestCallback | null)?.(0);
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('should_render_ats_and_update_import_title_when_has_resume', () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60) }));
    render(<ProfileTab />);
    expect(screen.getByTestId('mock-ats-section')).toBeTruthy();
    expect(screen.getByTestId('mock-import-section').getAttribute('data-title')).toBe('ATUALIZAR CURRÍCULO');
  });

  it('should_render_import_without_ats_when_skills_but_no_resume', () => {
    useProfileMock.mockReturnValue(baseProfile({ skills: ['Python'] }));
    render(<ProfileTab />);
    expect(screen.getByTestId('mock-import-section')).toBeTruthy();
    expect(screen.getByTestId('mock-import-section').getAttribute('data-title')).toBe('');
    expect(screen.queryByTestId('mock-ats-section')).toBeNull();
  });

  it('should_compute_all_checks_done_for_complete_profile', () => {
    useProfileMock.mockReturnValue(
      baseProfile({
        skills: ['python', 'sql', 'aws'],
        seniority: 'pleno',
        experienceYears: 5,
        currentRole: 'Analista',
        area: 'Dados',
        resumeText: 'x'.repeat(60),
      }),
    );
    render(<ProfileTab />);
    const checks = screen.getAllByTestId('mock-check');
    expect(checks).toHaveLength(6);
    checks.forEach((c) => expect(c.getAttribute('data-done')).toBe('true'));
  });

  it('should_mark_resume_check_pending_when_resume_text_short', () => {
    useProfileMock.mockReturnValue(
      baseProfile({
        skills: ['python', 'sql', 'aws'],
        seniority: 'pleno',
        experienceYears: 5,
        currentRole: 'Analista',
        area: 'Dados',
        resumeText: 'x'.repeat(40),
      }),
    );
    render(<ProfileTab />);
    const resumeCheck = screen
      .getAllByTestId('mock-check')
      .find((c) => c.getAttribute('data-label') === 'Currículo importado');
    expect(resumeCheck?.getAttribute('data-done')).toBe('false');
  });

  it('should_mark_none_done_for_empty_profile', () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60) }));
    render(<ProfileTab />);
    const checks = screen.getAllByTestId('mock-check');
    expect(checks[0].getAttribute('data-done')).toBe('false');
    expect(checks[1].getAttribute('data-done')).toBe('false');
    expect(checks[2].getAttribute('data-done')).toBe('false');
    expect(checks[3].getAttribute('data-done')).toBe('false');
    expect(checks[4].getAttribute('data-done')).toBe('false');
  });

  it('should_pass_percent_and_counts_to_completion_card', () => {
    useProfileMock.mockReturnValue(
      baseProfile({ resumeMarkdown: 'x'.repeat(60), completionPercent: 33, completionScore: 2 }),
    );
    render(<ProfileTab />);
    const card = screen.getByTestId('mock-completion-card');
    expect(card.getAttribute('data-percent')).toBe('33');
    expect(card.getAttribute('data-completed')).toBe('2');
    expect(card.getAttribute('data-total')).toBe('6');
  });

  it('should_propagate_field_change_to_profile_set_field', () => {
    render(<ProfileTab />);
    fireEvent.click(screen.getByText('PREENCHER MANUALMENTE'));
    fireEvent.click(screen.getByText('CHANGE ROLE'));
    expect(useProfileMock().setField).toHaveBeenCalledWith('currentRole', 'Engenheiro');
  });

  it('should_save_profile_and_show_success_snackbar', async () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60) }));
    render(<ProfileTab />);
    fireEvent.click(screen.getByText('SALVAR PERFIL'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Perfil salvo com sucesso!', 'success'));
  });

  it('should_show_error_snackbar_when_save_fails', async () => {
    useProfileMock.mockReturnValue(
      baseProfile({
        resumeMarkdown: 'x'.repeat(60),
        handleSave: vi.fn().mockResolvedValue({ success: false, error: 'Erro ao salvar' }),
      }),
    );
    render(<ProfileTab />);
    fireEvent.click(screen.getByText('SALVAR PERFIL'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Erro ao salvar', 'error'));
  });

  it('should_show_saving_state_on_button', () => {
    useProfileMock.mockReturnValue(baseProfile({ resumeMarkdown: 'x'.repeat(60), saving: true }));
    render(<ProfileTab />);
    expect(screen.getByText('SALVANDO PERFIL...')).toBeTruthy();
    const button = screen.getByRole('button', { name: /SALVANDO PERFIL/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('should_show_success_snackbar_when_extract_succeeds', async () => {
    useProfileMock.mockReturnValue(
      baseProfile({
        resumeMarkdown: 'x'.repeat(60),
        extractFromResume: vi.fn().mockResolvedValue({ success: true, message: 'Currículo processado! 5 skills encontradas' }),
      }),
    );
    render(<ProfileTab />);
    fireEvent.click(screen.getByText('EXTRACT FILE'));
    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith('Currículo processado! 5 skills encontradas', 'success'),
    );
  });

  it('should_show_default_success_message_when_extract_has_no_message', async () => {
    useProfileMock.mockReturnValue(
      baseProfile({
        resumeMarkdown: 'x'.repeat(60),
        extractFromResume: vi.fn().mockResolvedValue({ success: true }),
      }),
    );
    render(<ProfileTab />);
    fireEvent.click(screen.getByText('EXTRACT TEXT'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Extraído com sucesso!', 'success'));
  });

  it('should_show_error_snackbar_when_extract_fails', async () => {
    useProfileMock.mockReturnValue(
      baseProfile({
        resumeMarkdown: 'x'.repeat(60),
        extractFromResume: vi.fn().mockResolvedValue({ success: false, error: 'Erro ao processar' }),
      }),
    );
    render(<ProfileTab />);
    fireEvent.click(screen.getByText('EXTRACT FILE'));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('Erro ao processar', 'error'));
  });

  it('should_render_load_error_with_retry', () => {
    useProfileMock.mockReturnValue(baseProfile({ loadError: 'Falha ao carregar perfil. Tente novamente.' }));
    render(<ProfileTab />);
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByText('Tentar novamente'));
    expect(useProfileMock().loadProfile).toHaveBeenCalled();
  });
});