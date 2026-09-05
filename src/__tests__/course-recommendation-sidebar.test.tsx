// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseRecommendationSidebar } from "@/components/busca/course-recommendation-sidebar";

const { mockRecommendCourses } = vi.hoisted(() => ({
  mockRecommendCourses: vi.fn(),
}));

vi.mock("@/lib/core/courses/course-matcher", () => ({
  recommendCourses: mockRecommendCourses,
}));

vi.mock("@/components/cursos/course-card", () => ({
  CourseCard: ({ course }: any) => (
    <div data-testid="course-card">{course.title}</div>
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const courses = [
  {
    id: "c1",
    provider: "udemy",
    title: "React Avançado",
    description: "Hooks e performance.",
    skillTags: ["react"],
    priceLabel: "R$ 39,90",
    rating: "4.7",
    url: "https://www.udemy.com/courses/search/?q=react",
  },
  {
    id: "c2",
    provider: "udemy",
    title: "Python para Dados",
    description: "Pandas e NumPy.",
    skillTags: ["python"],
    priceLabel: "R$ 29,90",
    rating: "4.5",
    url: "https://www.udemy.com/courses/search/?q=python",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CourseRecommendationSidebar", () => {
  it("should_render_header_and_catalog_link", () => {
    mockRecommendCourses.mockReturnValue([]);
    render(<CourseRecommendationSidebar terms={[]} area={null} />);
    expect(screen.getByText(/CURSOS RECOMENDADOS PARA VOCÊ/)).toBeTruthy();
    const link = screen.getByTestId("course-recommendation-catalog-link");
    expect(link.getAttribute("href")).toBe("/cursos");
    expect(screen.getByText(/EXPLORAR CATÁLOGO COMPLETO/)).toBeTruthy();
  });

  it("should_show_empty_state_when_no_courses", () => {
    mockRecommendCourses.mockReturnValue([]);
    render(<CourseRecommendationSidebar terms={[]} area={null} />);
    expect(screen.getByTestId("course-recommendation-empty-state")).toBeTruthy();
    expect(
      screen.getByText(/Busque por um cargo no topo da página/),
    ).toBeTruthy();
    expect(screen.queryAllByTestId("course-card").length).toBe(0);
  });

  it("should_render_course_cards_for_recommendations", () => {
    mockRecommendCourses.mockReturnValue(courses);
    render(<CourseRecommendationSidebar terms={["React"]} area="Frontend" />);
    const cards = screen.getAllByTestId("course-card");
    expect(cards.length).toBe(2);
    expect(screen.getByText("React Avançado")).toBeTruthy();
    expect(screen.getByText("Python para Dados")).toBeTruthy();
    expect(mockRecommendCourses).toHaveBeenCalledWith(["React"], "Frontend", 4);
  });

  it("should_call_recommend_courses_with_empty_terms_and_limit_4", () => {
    mockRecommendCourses.mockReturnValue([]);
    render(<CourseRecommendationSidebar terms={[]} area={undefined} />);
    expect(mockRecommendCourses).toHaveBeenCalledWith([], undefined, 4);
  });

  it("should_render_focus_chip_with_terms", () => {
    mockRecommendCourses.mockReturnValue([]);
    render(<CourseRecommendationSidebar terms={["React", "Node"]} area="Frontend" />);
    expect(screen.getByText("Foco: React, Node")).toBeTruthy();
  });

  it("should_render_focus_chip_with_area_when_no_terms", () => {
    mockRecommendCourses.mockReturnValue([]);
    render(<CourseRecommendationSidebar terms={[]} area="Backend" />);
    expect(screen.getByText("Foco: Backend")).toBeTruthy();
  });

  it("should_not_render_focus_chip_without_terms_or_area", () => {
    mockRecommendCourses.mockReturnValue([]);
    render(<CourseRecommendationSidebar terms={[]} area={null} />);
    expect(screen.queryByText(/Foco:/)).toBeNull();
  });

  it("should_render_footer_affiliation_message", () => {
    mockRecommendCourses.mockReturnValue([]);
    render(<CourseRecommendationSidebar terms={[]} area={null} />);
    expect(
      screen.getByText(/Cursos parceiros recomendados com base nas tecnologias/),
    ).toBeTruthy();
  });
});