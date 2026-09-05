// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JobMobileCard } from "@/components/job-table/job-mobile-card";
import type { Job } from "@/lib/types/job";

const { mockTrackJobApply } = vi.hoisted(() => ({
  mockTrackJobApply: vi.fn(),
}));

vi.mock("@/lib/utils/analytics", () => ({
  trackJobApply: mockTrackJobApply,
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

describe("JobMobileCard", () => {
  it("should_render_company_title_and_platform_badge", () => {
    render(<JobMobileCard {...BASE} job={baseJob} />);
    expect(screen.getByText("Nubank")).toBeTruthy();
    expect(screen.getByText("Analista de Dados")).toBeTruthy();
    expect(screen.getByText("Gupy")).toBeTruthy();
  });

  it("should_render_date_type_and_location_pills", () => {
    render(<JobMobileCard {...BASE} job={baseJob} />);
    expect(screen.getByText(/📅/)).toBeTruthy();
    expect(screen.getByText("hybrid")).toBeTruthy();
    expect(screen.getByText(/📍/)).toBeTruthy();
  });

  it("should_omit_date_type_and_location_pills_when_missing", () => {
    const job = {
      ...baseJob,
      postedAt: "",
      detectedAt: undefined,
      type: "",
      location: "",
    } as unknown as Job;
    render(<JobMobileCard {...BASE} job={job} />);
    expect(screen.queryByText(/📅/)).toBeNull();
    expect(screen.queryByText(/📍/)).toBeNull();
    expect(screen.queryByText("hybrid")).toBeNull();
  });

  it("should_render_apply_link_with_expected_attributes_and_text", () => {
    render(<JobMobileCard {...BASE} job={baseJob} />);
    const link = screen.getByTestId("job-mobile-card-apply-link");
    expect(link.getAttribute("href")).toBe(baseJob.link);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(screen.getByText("VER VAGA NO GUPY →")).toBeTruthy();
  });

  it("should_track_apply_click", () => {
    render(<JobMobileCard {...BASE} job={baseJob} />);
    fireEvent.click(screen.getByTestId("job-mobile-card-apply-link"));
    expect(mockTrackJobApply).toHaveBeenCalledWith({
      title: baseJob.title,
      company: baseJob.company,
      platform: baseJob.platform,
      link: baseJob.link,
    });
  });

  it("should_not_render_ats_and_resume_actions_when_can_generate_resume_false", () => {
    render(<JobMobileCard {...BASE} job={baseJob} />);
    expect(screen.queryByTestId("job-mobile-card-ats-button")).toBeNull();
    expect(screen.queryByTestId("job-mobile-card-resume-button")).toBeNull();
  });

  it("should_call_on_analyze_ats_on_click_and_keyboard", () => {
    const onAnalyzeAts = vi.fn();
    render(
      <JobMobileCard
        {...BASE}
        canGenerateResume
        onAnalyzeAts={onAnalyzeAts}
        job={baseJob}
      />,
    );
    const ats = screen.getByTestId("job-mobile-card-ats-button");
    fireEvent.click(ats);
    expect(onAnalyzeAts).toHaveBeenCalledWith(baseJob);
    onAnalyzeAts.mockClear();
    fireEvent.keyDown(ats, { key: "Enter" });
    expect(onAnalyzeAts).toHaveBeenCalledWith(baseJob);
    onAnalyzeAts.mockClear();
    fireEvent.keyDown(ats, { key: " " });
    expect(onAnalyzeAts).toHaveBeenCalledWith(baseJob);
  });

  it("should_call_on_generate_resume_on_click_and_keyboard", () => {
    const onGenerateResume = vi.fn();
    render(
      <JobMobileCard
        {...BASE}
        canGenerateResume
        onGenerateResume={onGenerateResume}
        job={baseJob}
      />,
    );
    const btn = screen.getByTestId("job-mobile-card-resume-button");
    fireEvent.click(btn);
    expect(onGenerateResume).toHaveBeenCalledWith(baseJob);
    onGenerateResume.mockClear();
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onGenerateResume).toHaveBeenCalledWith(baseJob);
  });

  it("should_mark_resume_button_disabled_and_generating_when_key_matches", () => {
    render(
      <JobMobileCard
        {...BASE}
        canGenerateResume
        generatingJobKey={`${baseJob.company}|${baseJob.title}`}
        job={baseJob}
      />,
    );
    const btn = screen.getByTestId("job-mobile-card-resume-button");
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("GERANDO CURRÍCULO...")).toBeTruthy();
  });

  it("should_render_default_resume_label_when_key_does_not_match", () => {
    render(
      <JobMobileCard
        {...BASE}
        canGenerateResume
        generatingJobKey="outra|chave"
        job={baseJob}
      />,
    );
    const btn = screen.getByTestId("job-mobile-card-resume-button");
    expect(btn.getAttribute("aria-disabled")).toBe("false");
    expect(screen.getByText("GERAR CURRÍCULO ADAPTADO")).toBeTruthy();
  });

  it("should_render_without_crashing_when_company_is_empty", () => {
    const job = { ...baseJob, company: "" } as Job;
    render(<JobMobileCard {...BASE} job={job} />);
    expect(screen.getByText("Analista de Dados")).toBeTruthy();
  });
});