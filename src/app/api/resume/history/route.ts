import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/infrastructure/db/prisma-client";
import {
  adaptedResumeToMarkdown,
  type AdaptedResume,
} from "@/lib/core/ai/resume-adaptation-generator";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE),
  );

  try {
    const where = {
      userId: session.user.id,
      kind: "resume_adaptation",
      expiresAt: { gt: new Date() },
    };

    const [items, total] = await Promise.all([
      prisma.generatedContentCache.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.generatedContentCache.count({ where }),
    ]);

    const history = items.map((item) => {
      const content = item.content as AdaptedResume & {
        jobTitle?: string;
        jobCompany?: string;
        jobLocation?: string;
      };

      const jobTitle = content?.jobTitle || "Vaga";
      const jobCompany = content?.jobCompany || "";
      const jobLocation = content?.jobLocation || "";
      let resumeMarkdown = "";
      try {
        if (content) {
          resumeMarkdown = adaptedResumeToMarkdown(content);
        }
      } catch {
        resumeMarkdown = "";
      }

      return {
        id: item.id,
        jobTitle,
        jobCompany,
        jobLocation,
        createdAt: item.createdAt.toISOString(),
        expiresAt: item.expiresAt.toISOString(),
        resumeMarkdown,
      };
    });

    return NextResponse.json({
      history,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("[resume/history] Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de currículos." },
      { status: 500 },
    );
  }
}
