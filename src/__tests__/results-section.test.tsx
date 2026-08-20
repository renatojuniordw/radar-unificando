// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/job-table/job-table', () => ({
  JobTable: ({ jobs, loading }: any) => (
    <div data-testid="job-table">
      <span data-testid="job-count">{jobs.length}</span>
      {loading && <span data-testid="loading-indicator">Loading</span>}
    </div>
  ),
}));

vi.mock('@/lib/infrastructure/ui/tokens', () => ({
  tokens: {
    accent: '#ccff00',
    surfaceHover: '#f8fafc',
    border: '2px solid #020617',
    primary: '#020617',
  },
}));

import { ResultsSection } from '@/components/home/results-section';

const defaultProps = {
  recommendedMode: false,
  jobs: [],
  loading: false,
  autoSyncing: false,
  roleCategories: [],
  areaOrRole: '',
  onFilterChange: vi.fn(),
  canGenerateResume: false,
  onGenerateResume: vi.fn(),
  generatingJobKey: null,
  onAnalyzeAts: vi.fn(),
};

describe('ResultsSection', () => {
  it('should_render_job_table', () => {
    render(<ResultsSection {...defaultProps} />);
    expect(screen.getByTestId('job-table')).toBeTruthy();
  });

  it('should_pass_jobs_to_job_table', () => {
    const jobs = [{ id: '1' }, { id: '2' }] as any[];
    render(<ResultsSection {...defaultProps} jobs={jobs} />);
    expect(screen.getByTestId('job-count').textContent).toBe('2');
  });

  it('should_pass_loading_to_job_table', () => {
    render(<ResultsSection {...defaultProps} loading={true} />);
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should_show_recommended_heading_when_recommended_mode_with_jobs', () => {
    const jobs = [{ id: '1', company: 'ACME' }] as any[];
    render(
      <ResultsSection {...defaultProps} recommendedMode={true} jobs={jobs} areaOrRole="React" />
    );
    expect(screen.getByText(/RECOMENDADAS PARA VOCÊ/)).toBeTruthy();
    expect(screen.getByText('React')).toBeTruthy();
  });

  it('should_show_job_count_chip_when_recommended_mode', () => {
    const jobs = [{ id: '1', company: 'ACME' }, { id: '2', company: 'ACME' }] as any[];
    render(
      <ResultsSection {...defaultProps} recommendedMode={true} jobs={jobs} areaOrRole="Dev" />
    );
    expect(screen.getByText('2 vagas encontradas')).toBeTruthy();
  });

  it('should_show_company_count_chip_when_recommended_mode', () => {
    const jobs = [{ id: '1', company: 'ACME' }, { id: '2', company: 'Beta' }] as any[];
    render(
      <ResultsSection {...defaultProps} recommendedMode={true} jobs={jobs} areaOrRole="Dev" />
    );
    expect(screen.getByText('2 empresas')).toBeTruthy();
  });

  it('should_show_auto_syncing_indicator', () => {
    render(<ResultsSection {...defaultProps} autoSyncing={true} />);
    expect(screen.getByText(/Atualizando vagas em segundo plano/)).toBeTruthy();
  });
});
