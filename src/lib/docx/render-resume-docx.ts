import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import type { AdaptedResume } from "@/lib/core/ai/resume-adaptation-generator";

/**
 * Renderiza um objeto AdaptedResume em um arquivo binário Blob (.docx / Microsoft Word).
 */
export async function renderResumeDocx(resume: AdaptedResume): Promise<Blob> {
  const children: Paragraph[] = [];

  // Cabeçalho / Nome
  const displayName = resume.fullName;
  if (displayName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: displayName,
            bold: true,
            size: 32, // 16pt
            font: "Calibri",
            color: "020617",
          }),
        ],
      }),
    );
  }

  // Contatos
  const contactParts = [
    resume.contact?.email,
    resume.contact?.phone,
    resume.contact?.location,
    resume.contact?.linkedin,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: contactParts.join("  |  "),
            size: 20, // 10pt
            font: "Calibri",
            color: "475569",
          }),
        ],
      }),
    );
  }

  // Resumo Profissional
  if (resume.summary) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        children: [
          new TextRun({
            text: "RESUMO PROFISSIONAL",
            bold: true,
            size: 24, // 12pt
            font: "Calibri",
            color: "020617",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: resume.summary,
            size: 22, // 11pt
            font: "Calibri",
            color: "1e293b",
          }),
        ],
      }),
    );
  }

  // Habilidades & Competências
  if (resume.skills && resume.skills.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        children: [
          new TextRun({
            text: "HABILIDADES & COMPETÊNCIAS",
            bold: true,
            size: 24,
            font: "Calibri",
            color: "020617",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: resume.skills.join(", "),
            size: 22,
            font: "Calibri",
            color: "1e293b",
          }),
        ],
      }),
    );
  }

  // Experiências Profissionais
  if (resume.experience && resume.experience.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        children: [
          new TextRun({
            text: "EXPERIÊNCIA PROFISSIONAL",
            bold: true,
            size: 24,
            font: "Calibri",
            color: "020617",
          }),
        ],
      }),
    );

    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 40 },
          children: [
            new TextRun({
              text: `${exp.role || ""} `,
              bold: true,
              size: 22,
              font: "Calibri",
              color: "020617",
            }),
            new TextRun({
              text: exp.company ? `— ${exp.company}` : "",
              bold: true,
              size: 22,
              font: "Calibri",
              color: "334155",
            }),
            new TextRun({
              text: exp.period ? `  (${exp.period})` : "",
              italics: true,
              size: 20,
              font: "Calibri",
              color: "64748b",
            }),
          ],
        }),
      );

      if (exp.bullets) {
        for (const bullet of exp.bullets) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 22,
                  font: "Calibri",
                  color: "1e293b",
                }),
              ],
            }),
          );
        }
      }
    }
  }

  // Formação Acadêmica
  if (resume.education && resume.education.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        children: [
          new TextRun({
            text: "FORMAÇÃO ACADÊMICA",
            bold: true,
            size: 24,
            font: "Calibri",
            color: "020617",
          }),
        ],
      }),
    );

    for (const edu of resume.education) {
      const text = [edu.degree, edu.institution, edu.period].filter(Boolean).join(" — ");
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text,
              size: 22,
              font: "Calibri",
              color: "1e293b",
            }),
          ],
        }),
      );
    }
  }

  // Certificações
  if (resume.certifications && resume.certifications.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        children: [
          new TextRun({
            text: "CERTIFICAÇÕES",
            bold: true,
            size: 24,
            font: "Calibri",
            color: "020617",
          }),
        ],
      }),
    );

    for (const cert of resume.certifications) {
      const text = [cert.name, cert.issuer, cert.year].filter(Boolean).join(" — ");
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text,
              size: 22,
              font: "Calibri",
              color: "1e293b",
            }),
          ],
        }),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
