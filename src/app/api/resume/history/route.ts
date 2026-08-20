import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/infrastructure/db/prisma-client";
import {
  adaptedResumeToMarkdown,
  type AdaptedResume,
} from "@/lib/core/ai/resume-adaptation-generator";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const items = await prisma.generatedContentCache.findMany({
      where: {
        userId: session.user.id,
        kind: "resume_adaptation",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

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

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[resume/history] Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de currículos." },
      { status: 500 },
    );
  }
}
