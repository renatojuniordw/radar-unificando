// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobTable } from '@/components/job-table/job-table';
import type { Job } from '@/lib/types/job';

vi.mock('@/lib/utils/analytics', () => ({
  trackExportCsv: vi.fn(),
}));

import { trackExportCsv } from '@/lib/utils/analytics';

function stubMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeAll(() => {
  stubMatchMedia();
});

afterAll(() => {
  delete (window as any).matchMedia;
});

const JOBS: Job[] = [
  {
    id: '1',
    title: 'Analista de Dados',
    company: 'Nubank',
    platform: 'Gupy',
    type: 'hybrid',
    location: 'SP',
    link: 'https://gupy.io/jobs/1',
    companyNameOnPlatform: 'Nubank',
    roleCategory: 'Tecnologia',
    postedAt: '2026-08-10',
    alert: '',
    detectedAt: '2026-08-10',
  },
  {
    id: '2',
    title: 'Dev Python',
    company: 'iFood',
    platform: 'Gupy',
    type: 'remoto',
    location: 'RJ',
    link: 'https://gupy.io/jobs/2',
    companyNameOnPlatform: 'iFood',
    roleCategory: 'Tecnologia',
    postedAt: '2026-08-09',
    alert: '',
    detectedAt: '2026-08-09',
  },
];

const BASE = {
  loading: false,
  roleCategories: ['Tecnologia'],
  onFilterChange: vi.fn(),
  canGenerateResume: false,
  onGenerateResume: vi.fn(),
  generatingJobKey: null,
  onAnalyzeAts: vi.fn(),
};

describe('JobTable', () => {
  const createObjectUrlMock = vi.fn(() => 'blob:fake');
  const revokeObjectUrlMock = vi.fn();
  const clickMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
    clickMock.mockClear();
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;
    HTMLAnchorElement.prototype.click = clickMock;
  });

  it('should_render_loading_skeleton_when_loading', () => {
    const { container } = render(<JobTable {...BASE} jobs={[]} loading />);
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('should_render_empty_state_when_no_jobs', () => {
    render(<JobTable {...BASE} jobs={[]} loading={false} />);
    expect(screen.getByText('Nenhuma vaga encontrada')).toBeTruthy();
  });

  it('should_render_jobs_with_count', () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    expect(screen.getByText(/2 VAGAS ENCONTRADAS/)).toBeTruthy();
    expect(screen.getByText(/2 vagas no banco/)).toBeTruthy();
  });

  it('should_call_export_and_track_analytics', () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    fireEvent.click(screen.getByText('EXPORTAR CSV'));
    expect(trackExportCsv).toHaveBeenCalledWith(2);
    expect(createObjectUrlMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectUrlMock).toHaveBeenCalled();
  });

  it('should_render_job_titles', () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    expect(screen.getByText('Analista de Dados')).toBeTruthy();
    expect(screen.getByText('Dev Python')).toBeTruthy();
  });

  it('should_filter_jobs_by_type_quick_chip', () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    fireEvent.click(screen.getAllByText('REMOTO')[0]);
    expect(screen.queryByText('Analista de Dados')).toBeNull();
    expect(screen.getByText('Dev Python')).toBeTruthy();
  });

  it('should_clear_filter_when_clicking_active_chip', () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    fireEvent.click(screen.getAllByText('REMOTO')[0]);
    expect(screen.getByText(/1 VAGAS ENCONTRADAS/)).toBeTruthy();
    fireEvent.click(screen.getAllByText('REMOTO')[0]);
    expect(screen.getByText(/2 VAGAS ENCONTRADAS/)).toBeTruthy();
  });
});