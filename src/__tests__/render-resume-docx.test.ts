import { describe, it, expect } from "vitest";
import { renderResumeDocx } from "@/lib/docx/render-resume-docx";
import type { AdaptedResume } from "@/lib/core/ai/resume-adaptation-generator";

describe("renderResumeDocx", () => {
  it("should_render_a_valid_blob_from_adapted_resume", async () => {
    const mockResume: AdaptedResume = {
      fullName: "Maria Santos",
      headline: "Tech Lead | Engenheira de Software",
      languages: [],
      contact: {
        email: "maria@example.com",
        phone: "(11) 99999-9999",
        location: "São Paulo, SP",
        linkedin: "linkedin.com/in/mariasantos",
      },
      summary: "Engenheira de Software com foco em sistemas distribuídos.",
      skills: ["TypeScript", "Node.js", "React", "PostgreSQL"],
      experience: [
        {
          role: "Tech Lead",
          company: "Tech Corp",
          period: "2021 - Presente",
          bullets: [
            "Liderou equipe de 6 desenvolvedores no redesign da arquitetura.",
            "Melhorou o tempo de resposta das APIs em 40%.",
          ],
        },
      ],
      education: [
        {
          degree: "Bacharelado em Ciência da Computação",
          institution: "USP",
          period: "2016 - 2020",
        },
      ],
      certifications: [
        {
          name: "AWS Certified Solutions Architect",
          issuer: "Amazon Web Services",
          year: "2023",
        },
      ],
    };

    const blob = await renderResumeDocx(mockResume);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });
});
