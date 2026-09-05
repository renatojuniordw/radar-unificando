// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JobDesktopTable } from "@/components/job-table/job-desktop-table";
import type { Job } from "@/lib/types/job";

const { mockTrackJobApply, mockUseVirtualizer } = vi.hoisted(() => ({
  mockTrackJobApply: vi.fn(),
  mockUseVirtualizer: vi.fn(),
}));

vi.mock("@/lib/utils/analytics", () => ({
  trackJobApply: mockTrackJobApply,
}));

// TanStack Virtual depende de ResizeObserver/scroll element para medir itens;
// no jsdom isso nunca dispara e a tabela renderiza 0 linhas. Mockamos apenas a
// API da virtualização, mantendo a lógica de renderização das linhas real.
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: mockUseVirtualizer,
}));

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
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

beforeEach(() => {
  vi.clearAllMocks();
  mockUseVirtualizer.mockImplementation(({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: i,
        start: i * 54,
        size: 54,
        measureElement: vi.fn(),
      })),
    getTotalSize: () => count * 54,
  }));
});

const baseJob: Job = {
  id: "1",
  title: "Analista de Dados",
  company: "Nubank",
  platform: "Gupy",
  type: "hybrid",
  location: "São Paulo",
  link: "https://gupy.io/jobs/1",
  companyNameOnPlatform: "Nubank",
  roleCategory: "Tecnologia",
  postedAt: "2026-08-10",
  alert: "",
  detectedAt: "2026-08-10",
};

const BASE = {
  canGenerateResume: false,
  onGenerateResume: vi.fn(),
  generatingJobKey: null,
  onAnalyzeAts: vi.fn(),
};

describe("JobDesktopTable", () => {
  it("should_render_column_headers", () => {
    render(<JobDesktopTable {...BASE} jobs={[]} />);
    ["EMPRESA", "PLATAFORMA", "DATA", "TÍTULO DA VAGA", "LOCALIDADE", "AÇÃO"].forEach(
      (header) => {
        expect(screen.getByText(header)).toBeTruthy();
      },
    );
  });

  it("should_render_no_rows_when_jobs_empty", () => {
    render(<JobDesktopTable {...BASE} jobs={[]} />);
    expect(screen.queryAllByTestId("job-table-row").length).toBe(0);
  });

  it("should_render_job_data_in_rows", () => {
    const jobs = [
      baseJob,
      {
        ...baseJob,
        id: "2",
        title: "Dev Python",
        company: "iFood",
        platform: "InHire",
        location: "Remoto",
      },
    ] as Job[];
    render(<JobDesktopTable {...BASE} jobs={jobs} />);
    expect(screen.getByText("Nubank")).toBeTruthy();
    expect(screen.getByText("iFood")).toBeTruthy();
    expect(screen.getByText("Analista de Dados")).toBeTruthy();
    expect(screen.getByText("Dev Python")).toBeTruthy();
    expect(screen.getByText("Gupy")).toBeTruthy();
    expect(screen.getByText("InHire")).toBeTruthy();
  });

  it("should_render_apply_link_with_expected_attributes", () => {
    render(<JobDesktopTable {...BASE} jobs={[baseJob]} />);
    const link = screen.getByTestId("job-table-apply-link");
    expect(link.getAttribute("href")).toBe(baseJob.link);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("aria-label")).toBe(
      `Ver vaga ${baseJob.title} na ${baseJob.company}`,
    );
  });

  it("should_track_apply_click", () => {
    render(<JobDesktopTable {...BASE} jobs={[baseJob]} />);
    fireEvent.click(screen.getByTestId("job-table-apply-link"));
    expect(mockTrackJobApply).toHaveBeenCalledWith({
      title: baseJob.title,
      company: baseJob.company,
      platform: baseJob.platform,
      link: baseJob.link,
    });
  });

  it("should_not_render_resume_actions_when_can_generate_resume_is_false", () => {
    render(<JobDesktopTable {...BASE} jobs={[baseJob]} />);
    expect(screen.queryByTestId("job-table-ats-button")).toBeNull();
    expect(screen.queryByTestId("job-table-resume-button")).toBeNull();
  });

  it("should_call_on_analyze_ats_and_on_generate_resume_when_actions_available", () => {
    const onAnalyzeAts = vi.fn();
    const onGenerateResume = vi.fn();
    render(
      <JobDesktopTable
        {...BASE}
        canGenerateResume
        onAnalyzeAts={onAnalyzeAts}
        onGenerateResume={onGenerateResume}
        jobs={[baseJob]}
      />,
    );
    fireEvent.click(screen.getByTestId("job-table-ats-button"));
    expect(onAnalyzeAts).toHaveBeenCalledWith(baseJob);
    fireEvent.click(screen.getByTestId("job-table-resume-button"));
    expect(onGenerateResume).toHaveBeenCalledWith(baseJob);
  });

  it("should_disable_resume_button_and_show_generating_for_matching_key", () => {
    render(
      <JobDesktopTable
        {...BASE}
        canGenerateResume
        generatingJobKey={`${baseJob.company}|${baseJob.title}`}
        jobs={[baseJob]}
      />,
    );
    const btn = screen.getByTestId("job-table-resume-button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain("GERANDO...");
  });

  it("should_enable_resume_button_when_key_does_not_match", () => {
    render(
      <JobDesktopTable
        {...BASE}
        canGenerateResume
        generatingJobKey="outra|chave"
        jobs={[baseJob]}
      />,
    );
    const btn = screen.getByTestId("job-table-resume-button") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain("GERAR CURRÍCULO");
  });

  it("should_handle_jobs_without_dates_gracefully", () => {
    const noDateJob = {
      ...baseJob,
      postedAt: "",
      detectedAt: undefined,
    } as unknown as Job;
    render(<JobDesktopTable {...BASE} jobs={[noDateJob]} />);
    expect(screen.getByText("Analista de Dados")).toBeTruthy();
  });

  it("should_render_relative_date_when_dates_provided", () => {
    render(<JobDesktopTable {...BASE} jobs={[baseJob]} />);
    expect(screen.getAllByText(/há /).length).toBeGreaterThan(0);
  });
});