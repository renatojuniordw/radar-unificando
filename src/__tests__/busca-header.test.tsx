// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BuscaHeader } from "@/components/busca/busca-header";
import {
  SUGGESTED_COMPANIES,
  SUGGESTED_ROLES,
} from "@/lib/constants/home";

const { mockJobSearchBar } = vi.hoisted(() => ({
  mockJobSearchBar: vi.fn(),
}));

vi.mock("@/components/shared/job-search-bar", () => ({
  JobSearchBar: (props: any) => {
    mockJobSearchBar(props);
    return <div data-testid="job-search-bar-mock" />;
  },
}));

const baseProps = {
  companies: [],
  onCompaniesChange: vi.fn(),
  roleQueries: [],
  onRoleQueriesChange: vi.fn(),
  cooldown: 0,
  running: false,
  onStart: vi.fn(),
  onAddSuggestion: vi.fn(),
  onAddCompany: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BuscaHeader", () => {
  it("should_render_title_and_eyebrow", () => {
    render(<BuscaHeader {...baseProps} />);
    expect(screen.getByText("VAGAS")).toBeTruthy();
    expect(screen.getByText("CENTRAL DE BUSCA")).toBeTruthy();
  });

  it("should_render_cooldown_chip_when_cooling_down", () => {
    render(<BuscaHeader {...baseProps} cooldown={30} />);
    const chip = screen.getByTestId("busca-cooldown-chip");
    expect(chip.textContent).toContain("Aguarde 30s para nova busca");
  });

  it("should_not_render_cooldown_chip_without_cooldown", () => {
    render(<BuscaHeader {...baseProps} />);
    expect(screen.queryByTestId("busca-cooldown-chip")).toBeNull();
  });

  it("should_forward_queries_companies_running_and_callbacks_to_search_bar", () => {
    const onStart = vi.fn();
    const onAddSuggestion = vi.fn();
    const onAddCompany = vi.fn();
    const onCompaniesChange = vi.fn();
    const onRoleQueriesChange = vi.fn();
    render(
      <BuscaHeader
        {...baseProps}
        companies={["Nubank"]}
        roleQueries={["React"]}
        running
        cooldown={5}
        onStart={onStart}
        onAddSuggestion={onAddSuggestion}
        onAddCompany={onAddCompany}
        onCompaniesChange={onCompaniesChange}
        onRoleQueriesChange={onRoleQueriesChange}
      />,
    );

    // BuscaHeader também deve sempre renderizar a barra de busca unificada
    expect(screen.getByTestId("job-search-bar-mock")).toBeTruthy();

    expect(mockJobSearchBar).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "header",
        roleQueries: ["React"],
        companies: ["Nubank"],
        running: true,
        cooldown: 5,
        onStart,
        onCompaniesChange,
        onRoleQueriesChange,
        onAddRole: onAddSuggestion,
        onAddCompany,
        suggestedRoles: SUGGESTED_ROLES,
        suggestedCompanies: SUGGESTED_COMPANIES,
      }),
    );
  });
});