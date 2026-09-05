// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobTable } from '@/components/job-table/job-table';
import type { Job } from '@/lib/types/job';

vi.mock('@/lib/utils/analytics', () => ({
  trackExportCsv: vi.fn(),
  trackJobApply: vi.fn(),
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
  // jsdom não implementa scrollIntoView; a paginação mobile chama no container
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    writable: true,
    value: vi.fn(),
  });
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
  const createObjectUrlMock = vi.fn((_blob: Blob) => 'blob:fake') as Mock<(blob: Blob) => string>;
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

  it('should_escape_special_characters_when_exporting_csv', async () => {
    const specialJobs = [
      {
        ...JOBS[0],
        company: 'ACME, Inc.',
        title: 'Dev "Sênior"',
        alert: 'Novo\nalerta',
        roleCategory: '',
        type: '',
        location: '',
        companyNameOnPlatform: '',
        postedAt: '',
        detectedAt: '',
      },
    ] as Job[];
    render(<JobTable {...BASE} jobs={specialJobs} />);
    fireEvent.click(screen.getByText('EXPORTAR CSV'));
    expect(trackExportCsv).toHaveBeenCalledWith(1);
    expect(createObjectUrlMock).toHaveBeenCalled();

    const blob = createObjectUrlMock.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text).toContain('"ACME, Inc."');
    expect(text).toContain('"Dev ""Sênior"""');
    expect(text).toContain('"Novo\nalerta"');
    expect(text).toContain('"ACME, Inc.",Gupy,,,"Dev ""Sênior"""');
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

  it('should_show_initial_search_prompt_when_no_jobs_and_no_filters', () => {
    render(<JobTable {...BASE} jobs={[]} loading={false} />);
    expect(
      screen.getByText('Preencha os parâmetros e clique em BUSCAR VAGAS para iniciar.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('job-empty-state-clear-filters')).toBeNull();
  });

  it('should_show_exibindo_count_footer_with_plural', () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    expect(screen.getByText(/Exibindo 2 vagas/)).toBeTruthy();
  });

  it('should_show_exibindo_count_footer_with_singular', () => {
    render(<JobTable {...BASE} jobs={[JOBS[0]]} />);
    expect(screen.getByText(/Exibindo 1 vaga/)).toBeTruthy();
  });

  it('should_open_and_close_filters_drawer', () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    expect(screen.queryByTestId('job-filters-drawer-close')).toBeNull();
    fireEvent.click(screen.getByTestId('job-filters-mobile-advanced'));
    expect(screen.getByTestId('job-filters-drawer')).toBeTruthy();
    expect(screen.getByText('⚡ FILTROS AVANÇADOS')).toBeTruthy();
    // No jsdom o Drawer permanece montado durante a transição de saída;
    // o clique de fechar (setDrawerOpen(false)) não deve lançar erro.
    fireEvent.click(screen.getByTestId('job-filters-drawer-close'));
  });

  it('should_show_empty_state_with_clear_filters_when_filters_exclude_all_jobs', async () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    fireEvent.click(screen.getByTestId('job-filters-mobile-advanced'));

    // companyFilter = Nubank (híbrida) + typeFilter = Remota -> nenhuma vaga
    const companyAutocomplete = screen.getByTestId('job-filters-drawer-company-select');
    const companyInput = companyAutocomplete.querySelector('input') as HTMLInputElement;
    fireEvent.focus(companyInput);
    fireEvent.mouseDown(companyInput);
    fireEvent.change(companyInput, { target: { value: 'Nubank' } });
    const companyOption = await screen.findByRole('option', { name: 'Nubank' });
    fireEvent.click(companyOption);

    const remotoChip = screen
      .getAllByTestId('job-filters-mobile-type-chip')
      .find((chip) => chip.textContent === 'REMOTO');
    expect(remotoChip).toBeTruthy();
    fireEvent.click(remotoChip!);

    expect(
      screen.getByText('Tente limpar os filtros ou buscar por outro termo.'),
    ).toBeTruthy();
    const clearBtn = screen.getByTestId('job-empty-state-clear-filters');
    expect(clearBtn.textContent).toContain('REMOVER TODOS OS FILTROS');

    fireEvent.click(clearBtn);
    expect(screen.getByText(/2 VAGAS ENCONTRADAS/)).toBeTruthy();
    expect(BASE.onFilterChange).toHaveBeenCalledWith({});
  });

  it('should_filter_jobs_by_location_through_drawer', async () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    fireEvent.click(screen.getByTestId('job-filters-mobile-advanced'));

    const locationAutocomplete = screen.getByTestId('job-filters-drawer-location-select');
    const input = locationAutocomplete.querySelector('input') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.mouseDown(input);
    fireEvent.change(input, { target: { value: 'SP' } });
    const option = await screen.findByRole('option', { name: 'SP' });
    fireEvent.click(option);

    expect(screen.getByText(/1 VAGAS ENCONTRADAS/)).toBeTruthy();
    expect(screen.getByText('Analista de Dados')).toBeTruthy();
    expect(screen.queryByText('Dev Python')).toBeNull();
  });

  it('should_reset_mobile_page_when_filter_changes', () => {
    const manyJobs = Array.from({ length: 11 }, (_, i) => ({
      ...JOBS[0],
      id: String(i),
      title: `Vaga ${i}`,
    }));
    render(<JobTable {...BASE} jobs={manyJobs} />);
    fireEvent.click(screen.getByTestId('job-mobile-pagination-next'));
    expect(screen.getByText('PÁG 2 / 2')).toBeTruthy();
    fireEvent.click(screen.getAllByText('GUPY')[0]);
    expect(screen.getByText('PÁG 1 / 2')).toBeTruthy();
  });

  it('should_render_active_filter_chip_for_location', async () => {
    render(<JobTable {...BASE} jobs={JOBS} />);
    fireEvent.click(screen.getByTestId('job-filters-mobile-advanced'));

    const locationAutocomplete = screen.getByTestId('job-filters-drawer-location-select');
    const input = locationAutocomplete.querySelector('input') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.mouseDown(input);
    fireEvent.change(input, { target: { value: 'RJ' } });
    const option = await screen.findByRole('option', { name: 'RJ' });
    fireEvent.click(option);

    expect(screen.getByText('Filtros Ativos:')).toBeTruthy();
    expect(screen.getByText('Local: RJ')).toBeTruthy();
    expect(screen.getByTestId('job-filters-mobile-clear')).toBeTruthy();
  });
});