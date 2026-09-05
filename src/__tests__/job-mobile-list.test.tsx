// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { JobMobileList } from "@/components/job-table/job-mobile-list";
import type { Job } from "@/lib/types/job";

const { mockJobMobileCard } = vi.hoisted(() => ({
  mockJobMobileCard: vi.fn(),
}));

vi.mock("@/components/job-table/job-mobile-card", () => ({
  JobMobileCard: (props: any) => {
    mockJobMobileCard(props);
    return <div data-testid="job-mobile-card" />;
  },
}));

function makeJob(i: number): Job {
  return {
    id: String(i),
    title: `Vaga ${i}`,
    company: `Empresa ${i}`,
    platform: "Gupy",
    type: "remoto",
    location: "Remoto",
    link: `https://gupy.io/jobs/${i}`,
    companyNameOnPlatform: `Empresa ${i}`,
    roleCategory: "Tecnologia",
    postedAt: "2026-08-10",
    alert: "",
  };
}

function makeJobs(count: number): Job[] {
  return Array.from({ length: count }, (_, i) => makeJob(i + 1));
}

const BASE = {
  containerRef: createRef<HTMLDivElement>(),
  page: 1,
  onPageChange: vi.fn(),
  canGenerateResume: false,
  onGenerateResume: vi.fn(),
  generatingJobKey: null,
  onAnalyzeAts: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe("JobMobileList", () => {
  it("should_render_cards_for_jobs_on_current_page", () => {
    const jobs = makeJobs(3);
    render(<JobMobileList {...BASE} jobs={jobs} />);
    expect(screen.getAllByTestId("job-mobile-card").length).toBe(3);
    expect(mockJobMobileCard).toHaveBeenCalledTimes(3);
  });

  it("should_limit_to_10_cards_per_page", () => {
    render(<JobMobileList {...BASE} jobs={makeJobs(11)} />);
    expect(screen.getAllByTestId("job-mobile-card").length).toBe(10);
  });

  it("should_render_pagination_when_multiple_pages", () => {
    render(<JobMobileList {...BASE} jobs={makeJobs(11)} />);
    expect(screen.getByText("PÁG 1 / 2")).toBeTruthy();
    const prev = screen.getByTestId(
      "job-mobile-pagination-prev",
    ) as HTMLButtonElement;
    const next = screen.getByTestId(
      "job-mobile-pagination-next",
    ) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });

  it("should_go_to_next_page_on_next_click_and_scroll", () => {
    const onPageChange = vi.fn();
    render(
      <JobMobileList {...BASE} jobs={makeJobs(11)} page={1} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByTestId("job-mobile-pagination-next"));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("should_go_to_previous_page_on_prev_click", () => {
    const onPageChange = vi.fn();
    render(
      <JobMobileList {...BASE} jobs={makeJobs(11)} page={2} onPageChange={onPageChange} />,
    );
    const next = screen.getByTestId(
      "job-mobile-pagination-next",
    ) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    fireEvent.click(screen.getByTestId("job-mobile-pagination-prev"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("should_render_slice_for_second_page", () => {
    render(<JobMobileList {...BASE} jobs={makeJobs(11)} page={2} />);
    expect(screen.getAllByTestId("job-mobile-card").length).toBe(1);
  });

  it("should_not_render_pagination_when_single_page", () => {
    render(<JobMobileList {...BASE} jobs={makeJobs(2)} />);
    expect(screen.queryByTestId("job-mobile-pagination-next")).toBeNull();
    expect(screen.queryByTestId("job-mobile-pagination-prev")).toBeNull();
  });

  it("should_render_nothing_when_jobs_empty", () => {
    render(<JobMobileList {...BASE} jobs={[]} />);
    expect(screen.queryAllByTestId("job-mobile-card").length).toBe(0);
    expect(screen.queryByTestId("job-mobile-pagination-next")).toBeNull();
  });

  it("should_forward_resume_and_ats_handlers_to_cards", () => {
    const jobs = makeJobs(1);
    const canGenerateResume = true;
    const generatingJobKey = "Empresa 1|Vaga 1";
    const onGenerateResume = vi.fn();
    const onAnalyzeAts = vi.fn();
    render(
      <JobMobileList
        {...BASE}
        jobs={jobs}
        canGenerateResume={canGenerateResume}
        generatingJobKey={generatingJobKey}
        onGenerateResume={onGenerateResume}
        onAnalyzeAts={onAnalyzeAts}
      />,
    );
    expect(mockJobMobileCard).toHaveBeenCalledWith(
      expect.objectContaining({
        job: jobs[0],
        canGenerateResume,
        generatingJobKey,
        onGenerateResume,
        onAnalyzeAts,
      }),
    );
  });

  it("should_fall_back_to_company_title_key_when_id_missing", () => {
    const jobNoId = { ...makeJob(1), id: undefined };
    render(<JobMobileList {...BASE} jobs={[jobNoId as Job]} />);
    expect(screen.getAllByTestId("job-mobile-card").length).toBe(1);
  });
});