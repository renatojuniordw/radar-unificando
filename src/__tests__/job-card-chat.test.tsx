// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobCard } from '@/components/chat/job-card';
import type { ParsedJob } from '@/components/chat/job-card-parser';

const { downloadAdaptedResumeMock } = vi.hoisted(() => ({ downloadAdaptedResumeMock: vi.fn() }));

vi.mock('@/components/ats/ats-analysis-drawer', () => ({
  AtsAnalysisDrawer: ({ open, job, onClose }: any) =>
    open ? (
      <div data-testid="ats-drawer">
        <span>{job.title}</span>
        <button type="button" onClick={onClose}>fechar análise</button>
      </div>
    ) : null,
}));

vi.mock('@/lib/client/resume-download', () => ({
  downloadAdaptedResume: downloadAdaptedResumeMock,
}));

describe('JobCard', () => {
  const mockJob: ParsedJob = {
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'São Paulo',
    modality: 'Remoto',
    date: '20/08/2026',
    link: 'https://example.com/job/123',
    description: 'Descrição da vaga de engenheiro de software.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    downloadAdaptedResumeMock.mockReset();
  });

  it('should render job title', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Software Engineer')).toBeTruthy();
  });

  it('should render company name', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Tech Corp')).toBeTruthy();
  });

  it('should render location and modality', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText(/São Paulo/)).toBeTruthy();
    expect(screen.getByText(/Remoto/)).toBeTruthy();
  });

  it('should render date', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText(/Publicada em 20\/08\/2026/)).toBeTruthy();
  });

  it('should render link button when link is provided', () => {
    render(<JobCard job={mockJob} />);

    const linkButton = screen.getByRole('link', { name: /ver vaga/i });
    expect(linkButton).toBeTruthy();
    expect(linkButton.getAttribute('href')).toBe('https://example.com/job/123');
    expect(linkButton.getAttribute('target')).toBe('_blank');
  });

  it('should not render link button when link is not provided', () => {
    const jobWithoutLink: ParsedJob = {
      title: 'Software Engineer',
      company: 'Tech Corp',
    };

    render(<JobCard job={jobWithoutLink} />);

    expect(screen.queryByRole('link', { name: /ver vaga/i })).toBeNull();
  });

  it('should render description when provided', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Descrição')).toBeTruthy();
    expect(screen.getByText('Descrição da vaga de engenheiro de software.')).toBeTruthy();
  });

  it('should toggle description expansion', () => {
    render(<JobCard job={mockJob} />);

    const toggleButton = screen.getByRole('button', { name: /ver mais/i });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: /ver menos/i })).toBeTruthy();
  });

  it('should render ATS analysis button', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Analisar ATS')).toBeTruthy();
  });

  it('should render generate resume button', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Gerar Currículo')).toBeTruthy();
  });

  it('should handle job with missing optional fields', () => {
    const minimalJob: ParsedJob = {
      title: 'Developer',
      link: 'https://example.com/job/456',
    };

    render(<JobCard job={minimalJob} />);

    expect(screen.getByText('Developer')).toBeTruthy();
    expect(screen.getByRole('link', { name: /ver vaga/i })).toBeTruthy();
    expect(screen.queryByText('Tech Corp')).toBeNull();
  });

  it('should render job without date', () => {
    const jobWithoutDate: ParsedJob = {
      title: 'Developer',
      company: 'Company',
      link: 'https://example.com/job/789',
    };

    render(<JobCard job={jobWithoutDate} />);

    expect(screen.queryByText(/Publicada em/)).toBeNull();
  });

  it('should render job without modality', () => {
    const jobWithoutModality: ParsedJob = {
      title: 'Developer',
      location: 'Rio de Janeiro',
      link: 'https://example.com/job/101',
    };

    render(<JobCard job={jobWithoutModality} />);

    expect(screen.getByText(/Rio de Janeiro/)).toBeTruthy();
    expect(screen.queryByText(/Remoto/)).toBeNull();
  });

  it('should open ATS drawer when clicking analyze button', () => {
    render(<JobCard job={mockJob} />);

    fireEvent.click(screen.getByRole('button', { name: /analisar ats/i }));

    const drawer = screen.getByTestId('ats-drawer');
    expect(drawer.textContent).toContain('Software Engineer');
  });

  it('should close ATS drawer via onClose', () => {
    render(<JobCard job={mockJob} />);

    fireEvent.click(screen.getByRole('button', { name: /analisar ats/i }));
    fireEvent.click(screen.getByRole('button', { name: /fechar análise/i }));

    expect(screen.queryByTestId('ats-drawer')).toBeNull();
  });

  it('should show success snackbar and call download with job data', async () => {
    downloadAdaptedResumeMock.mockResolvedValue(undefined);
    render(<JobCard job={mockJob} />);

    fireEvent.click(screen.getByRole('button', { name: /gerar currículo/i }));

    await waitFor(() => {
      expect(screen.getByText('Currículo adaptado baixado!')).toBeTruthy();
    });
    expect(downloadAdaptedResumeMock).toHaveBeenCalledWith({
      title: 'Software Engineer',
      company: 'Tech Corp',
      description: 'Descrição da vaga de engenheiro de software.',
    });
  });

  it('should show error message from download failure', async () => {
    downloadAdaptedResumeMock.mockRejectedValue(new Error('Falha no servidor'));
    render(<JobCard job={mockJob} />);

    fireEvent.click(screen.getByRole('button', { name: /gerar currículo/i }));

    await waitFor(() => {
      expect(screen.getByText('Falha no servidor')).toBeTruthy();
    });
  });

  it('should show generic error message for non-error failure', async () => {
    downloadAdaptedResumeMock.mockRejectedValue('boom');
    render(<JobCard job={mockJob} />);

    fireEvent.click(screen.getByRole('button', { name: /gerar currículo/i }));

    await waitFor(() => {
      expect(screen.getByText('Erro ao gerar o currículo.')).toBeTruthy();
    });
  });

  it('should disable button and guard duplicate calls while generating', () => {
    downloadAdaptedResumeMock.mockImplementation(() => new Promise(() => {}));
    render(<JobCard job={mockJob} />);

    fireEvent.click(screen.getByRole('button', { name: /gerar currículo/i }));

    const loadingButton = screen.getByRole('button', { name: /gerando currículo/i });
    expect(loadingButton).toHaveProperty('disabled', true);
    // Guard `if (generating) return;` impede nova chamada durante a geração
    fireEvent.click(loadingButton);
    expect(downloadAdaptedResumeMock).toHaveBeenCalledTimes(1);
  });

  it('should not render description section when absent', () => {
    render(<JobCard job={{ title: 'Só título', company: 'X', link: 'https://x.com/v' }} />);

    expect(screen.queryByText('Descrição')).toBeNull();
    expect(screen.queryByRole('button', { name: /ver mais/i })).toBeNull();
  });

  it('should render meta caption when only date is present', () => {
    render(<JobCard job={{ title: 'Dev', company: 'C', date: '01/09/2026' }} />);

    expect(screen.getByText(/Publicada em 01\/09\/2026/)).toBeTruthy();
  });
});
