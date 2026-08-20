import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/resume/history/route";
import { requireAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/infrastructure/db/prisma-client";

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/infrastructure/db/prisma-client", () => ({
  prisma: {
    generatedContentCache: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("GET /api/resume/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should_return_unauthorized_when_auth_fails", async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      session: null,
      response: new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 }),
    });

    const res = await GET(new Request("http://localhost/api/resume/history") as any);
    expect(res.status).toBe(401);
  });

  it("should_return_user_generated_resumes_history", async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      session: { user: { id: "user-123" } },
      response: null,
    });

    const now = new Date();
    const expires = new Date(Date.now() + 86400000);

    (prisma.generatedContentCache.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "item-1",
        userId: "user-123",
        kind: "resume_adaptation",
        createdAt: now,
        expiresAt: expires,
        content: {
          name: "João Silva",
          jobTitle: "Dev React",
          jobCompany: "Acme Corp",
          jobLocation: "São Paulo",
          summary: "Desenvolvedor experiente",
          experience: [],
          skills: ["React"],
          education: [],
          certifications: [],
        },
      },
    ]);
    (prisma.generatedContentCache.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const res = await GET(new Request("http://localhost/api/resume/history") as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.history).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(body.history[0]).toEqual(
      expect.objectContaining({
        id: "item-1",
        jobTitle: "Dev React",
        jobCompany: "Acme Corp",
        jobLocation: "São Paulo",
      }),
    );
  });

  it("should_apply_page_and_pageSize_query_params", async () => {
    (requireAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      session: { user: { id: "user-123" } },
      response: null,
    });
    (prisma.generatedContentCache.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.generatedContentCache.count as ReturnType<typeof vi.fn>).mockResolvedValue(25);

    const res = await GET(new Request("http://localhost/api/resume/history?page=2&pageSize=10") as any);
    const body = await res.json();

    expect(prisma.generatedContentCache.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(10);
    expect(body.totalPages).toBe(3);
  });
});
