// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BuscaClient } from "@/app/busca/busca-client";
import { useJobSearch } from "@/hooks/useJobSearch";
import { downloadAdaptedResume, jobKey } from "@/lib/client/resume-download";
import type { Job } from "@/lib/types/job";

vi.mock("@/hooks/useJobSearch", () => ({
  useJobSearch: vi.fn(),
}));

vi.mock("@/lib/client/resume-download", () => ({
  downloadAdaptedResume: vi.fn(),
  jobKey: (job: { company: string; title: string }) =>
    `${job.company}|${job.title}`,
}));

vi.mock("@/components/busca/busca-header", () => ({
  BuscaHeader: ({ onAddCompany }: any) => (
    <div data-testid="busca-header-mock">
      <button data-testid="add-company" onClick={() => onAddCompany("iFood")}>
        add-company
      </button>
      <button
        data-testid="add-company-existing"
        onClick={() => {
          onAddCompany("iFood");
          onAddCompany("iFood");
        }}
      >
        add-company-existing
      </button>
    </div>
  ),
}));

vi.mock("@/components/home/loading-overlay", () => ({
  LoadingOverlay: () => <div data-testid="loading-overlay" />,
}));

vi.mock("@/components/busca/job-tools-banner", () => ({
  JobToolsBanner: ({ variant }: { variant: string }) => (
    <div data-testid={`job-tools-banner-${variant}`} />
  ),
}));

vi.mock("@/components/home/results-section", () => ({
  ResultsSection: ({
    jobs,
    loading,
    generatingJobKey,
    onGenerateResume,
    onAnalyzeAts,
  }: any) => (
    <div data-testid="results-section">
      <span data-testid="results-loading">{String(loading)}</span>
      <span data-testid="results-generating-key">{generatingJobKey || ""}</span>
      <button
        data-testid="fire-generate"
        onClick={() => jobs[0] && onGenerateResume(jobs[0])}
      >
        generate
      </button>
      <button data-testid="fire-ats" onClick={() => jobs[0] && onAnalyzeAts(jobs[0])}>
        ats
      </button>
    </div>
  ),
}));

vi.mock("@/components/busca/course-recommendation-sidebar", () => ({
  CourseRecommendationSidebar: () => <div data-testid="course-sidebar-mock" />,
}));

vi.mock("@/components/ats/ats-analysis-drawer", () => ({
  AtsAnalysisDrawer: ({ open, onClose }: any) => (
    <div data-testid="ats-drawer" data-state={open ? "open" : "closed"}>
      <button data-testid="ats-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

vi.mock("@/components/resume/resume-progress-toast", () => ({
  ResumeProgressToast: ({ state, onClose }: any) =>
    state ? (
      <div data-testid="resume-toast">
        <span data-testid="toast-status">{state.status}</span>
        <span data-testid="toast-message">{state.message}</span>
        <span data-testid="toast-step">{state.step}</span>
        <span data-testid="toast-percent">{state.progressPercent}</span>
        <span data-testid="toast-error">{state.errorMessage || ""}</span>
        <button data-testid="toast-close" onClick={onClose}>
          close
        </button>
      </div>
    ) : null,
}));

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
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

const JOB: Job = {
  id: "1",
  title: "Dev Python",
  company: "iFood",
  platform: "Gupy",
  type: "remoto",
  location: "Remoto",
  link: "https://gupy.io/jobs/1",
  companyNameOnPlatform: "iFood",
  roleCategory: "Tecnologia",
  postedAt: "2026-08-10",
  alert: "",
};

function makeState(overrides: Record<string, any> = {}) {
  return {
    session: null,
    sessionStatus: "unauthenticated",
    profile: { area: "", currentRole: "", resumeMarkdown: null, resumeText: "" },
    companies: [],
    setCompanies: vi.fn(),
    roleQueries: [],
    setRoleQueries: vi.fn(),
    running: false,
    autoSyncing: false,
    jobs: [JOB],
    loading: false,
    roleCategories: [],
    snackbar: null,
    setSnackbar: vi.fn(),
    cooldown: 0,
    recommendedMode: false,
    loadJobs: vi.fn(),
    addSuggestion: vi.fn(),
    handleStart: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useJobSearch).mockReturnValue(makeState() as any);
});

describe("BuscaClient", () => {
  it("should_render_header_results_and_course_sidebar", () => {
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.getByTestId("busca-header-mock")).toBeTruthy();
    expect(screen.getByTestId("results-section")).toBeTruthy();
    expect(screen.getByTestId("course-sidebar-mock")).toBeTruthy();
  });

  it("should_show_anonymous_tools_banner_when_not_logged_in", () => {
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.getByTestId("job-tools-banner-anonymous")).toBeTruthy();
  });

  it("should_show_no_resume_tools_banner_when_logged_in_without_resume", () => {
    vi.mocked(useJobSearch).mockReturnValue(
      makeState({ session: {}, sessionStatus: "authenticated" }) as any,
    );
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.getByTestId("job-tools-banner-no-resume")).toBeTruthy();
  });

  it("should_hide_tools_banner_while_session_loading", () => {
    vi.mocked(useJobSearch).mockReturnValue(
      makeState({ sessionStatus: "loading" }) as any,
    );
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.queryByTestId("job-tools-banner-anonymous")).toBeNull();
    expect(screen.queryByTestId("job-tools-banner-no-resume")).toBeNull();
  });

  it("should_hide_tools_banner_when_logged_in_with_resume", () => {
    vi.mocked(useJobSearch).mockReturnValue(
      makeState({
        session: {},
        sessionStatus: "authenticated",
        profile: { area: "", currentRole: "", resumeMarkdown: "x", resumeText: "" },
      }) as any,
    );
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.queryByTestId(/job-tools-banner-/)).toBeNull();
  });

  it("should_show_loading_overlay_when_running", () => {
    vi.mocked(useJobSearch).mockReturnValue(makeState({ running: true }) as any);
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.getByTestId("loading-overlay")).toBeTruthy();
  });

  it("should_not_show_loading_overlay_when_idle", () => {
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.queryByTestId("loading-overlay")).toBeNull();
  });

  it("should_render_snackbar_message_when_snackbar_set", () => {
    vi.mocked(useJobSearch).mockReturnValue(
      makeState({
        snackbar: {
          message: "Muitas buscas em pouco tempo. Aguarde alguns segundos.",
          severity: "error",
        },
      }) as any,
    );
    render(<BuscaClient initialJobs={[]} />);
    expect(
      screen.getByText("Muitas buscas em pouco tempo. Aguarde alguns segundos."),
    ).toBeTruthy();
  });

  it("should_not_render_snackbar_when_null", () => {
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.queryByTestId("busca-snackbar")).toBeNull();
  });

  it("should_open_ats_drawer_when_analyze_triggered", () => {
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.getByTestId("ats-drawer").getAttribute("data-state")).toBe(
      "closed",
    );
    fireEvent.click(screen.getByTestId("fire-ats"));
    expect(screen.getByTestId("ats-drawer").getAttribute("data-state")).toBe(
      "open",
    );
  });

  it("should_close_ats_drawer_when_close_triggered", () => {
    render(<BuscaClient initialJobs={[]} />);
    fireEvent.click(screen.getByTestId("fire-ats"));
    expect(screen.getByTestId("ats-drawer").getAttribute("data-state")).toBe(
      "open",
    );
    fireEvent.click(screen.getByTestId("ats-close"));
    expect(screen.getByTestId("ats-drawer").getAttribute("data-state")).toBe(
      "closed",
    );
  });

  it("should_run_on_add_company_updater_appending_and_deduplicating", () => {
    let companies: string[] = [];
    const setCompanies = vi.fn((updater: any) => {
      companies = typeof updater === "function" ? updater(companies) : updater;
    });
    vi.mocked(useJobSearch).mockReturnValue(
      makeState({ setCompanies }) as any,
    );

    render(<BuscaClient initialJobs={[]} />);
    fireEvent.click(screen.getByTestId("add-company"));
    fireEvent.click(screen.getByTestId("add-company-existing"));

    expect(setCompanies).toHaveBeenCalledTimes(3);
    // Primeiro clique adiciona; os dois seguintes (mesma empresa) só retornam o prev.
    expect(companies).toEqual(["iFood"]);
  });

  it("should_close_snackbar_when_alert_close_button_clicked", () => {
    const setSnackbar = vi.fn();
    vi.mocked(useJobSearch).mockReturnValue(
      makeState({
        snackbar: {
          message: "Muitas buscas em pouco tempo. Aguarde alguns segundos.",
          severity: "error",
        },
        setSnackbar,
      }) as any,
    );
    render(<BuscaClient initialJobs={[]} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(setSnackbar).toHaveBeenCalledWith(null);
  });

  it("should_close_snackbar_when_escape_keydown_triggered", () => {
    const setSnackbar = vi.fn();
    vi.mocked(useJobSearch).mockReturnValue(
      makeState({
        snackbar: { message: "Aviso", severity: "info" },
        setSnackbar,
      }) as any,
    );
    render(<BuscaClient initialJobs={[]} />);
    expect(screen.getByTestId("busca-snackbar")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(setSnackbar).toHaveBeenCalledWith(null);
  });

  it("should_show_generating_then_success_toast_when_resume_generated", async () => {
    let resolvePromise!: () => void;
    const pending = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(downloadAdaptedResume).mockImplementation(async (_job, cb) => {
      cb?.({
        step: 2,
        totalSteps: 3,
        message: "Adaptando experiências profissionais com IA...",
        progressPercent: 55,
      });
      await pending;
    });

    render(<BuscaClient initialJobs={[]} />);
    fireEvent.click(screen.getByTestId("fire-generate"));

    expect(screen.getByTestId("toast-status").textContent).toBe("generating");
    expect(screen.getByTestId("toast-step").textContent).toBe("2");
    expect(screen.getByTestId("toast-message").textContent).toBe(
      "Adaptando experiências profissionais com IA...",
    );
    expect(screen.getByTestId("results-generating-key").textContent).toBe(
      jobKey(JOB),
    );

    resolvePromise();
    await waitFor(() =>
      expect(screen.getByTestId("toast-status").textContent).toBe("success"),
    );
    expect(screen.getByTestId("toast-message").textContent).toBe(
      "Currículo confeccionado com sucesso! O download do PDF começou.",
    );
    expect(screen.getByTestId("toast-step").textContent).toBe("3");
    expect(screen.getByTestId("toast-percent").textContent).toBe("100");
    expect(screen.getByTestId("results-generating-key").textContent).toBe("");
  });

  it("should_show_error_toast_when_resume_generation_fails", async () => {
    vi.mocked(downloadAdaptedResume).mockRejectedValue(new Error("Falha de rede."));
    render(<BuscaClient initialJobs={[]} />);
    fireEvent.click(screen.getByTestId("fire-generate"));
    await waitFor(() =>
      expect(screen.getByTestId("toast-status").textContent).toBe("error"),
    );
    expect(screen.getByTestId("toast-error").textContent).toBe("Falha de rede.");
    expect(screen.getByTestId("toast-step").textContent).toBe("0");
    expect(screen.getByTestId("toast-percent").textContent).toBe("0");
    expect(screen.getByTestId("results-generating-key").textContent).toBe("");
  });

  it("should_fallback_to_generic_message_when_error_is_not_an_error_instance", async () => {
    vi.mocked(downloadAdaptedResume).mockRejectedValue("boom");
    render(<BuscaClient initialJobs={[]} />);
    fireEvent.click(screen.getByTestId("fire-generate"));
    await waitFor(() =>
      expect(screen.getByTestId("toast-status").textContent).toBe("error"),
    );
    expect(screen.getByTestId("toast-error").textContent).toBe(
      "Erro ao gerar o currículo.",
    );
  });

  it("should_handle_resume_generation_for_job_without_company", async () => {
    const jobNoCompany: Job = { ...JOB, company: "" };
    vi.mocked(useJobSearch).mockReturnValue(
      makeState({ jobs: [jobNoCompany] }) as any,
    );
    vi.mocked(downloadAdaptedResume).mockResolvedValue(undefined);
    render(<BuscaClient initialJobs={[]} />);
    fireEvent.click(screen.getByTestId("fire-generate"));
    await waitFor(() =>
      expect(screen.getByTestId("toast-status").textContent).toBe("success"),
    );
    expect(screen.getByTestId("toast-percent").textContent).toBe("100");
  });

  it("should_close_resume_toast_on_close", async () => {
    vi.mocked(downloadAdaptedResume).mockResolvedValue(undefined);
    render(<BuscaClient initialJobs={[]} />);
    fireEvent.click(screen.getByTestId("fire-generate"));
    await waitFor(() =>
      expect(screen.getByTestId("toast-status").textContent).toBe("success"),
    );
    fireEvent.click(screen.getByTestId("toast-close"));
    expect(screen.queryByTestId("resume-toast")).toBeNull();
  });
});