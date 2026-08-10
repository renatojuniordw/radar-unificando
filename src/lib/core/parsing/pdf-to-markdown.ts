interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

interface TextLine {
  y: number;
  items: TextItem[];
  text: string;
  fontSize: number;
  isBold: boolean;
}

const BULLET_CHARS = ['•', '●', '○', '▶', '►', '→', '-', '*'];
const SECTION_KEYWORDS = [
  'contato', 'contact',
  'experiência', 'experience', 'experiencia profissional', 'work experience',
  'formação', 'education', 'formação acadêmica', 'academic education',
  'skills', 'competências', 'competencias', 'principais competências', 'key skills',
  'certificações', 'certifications', 'certificados',
  'projetos', 'projects',
  'idiomas', 'languages',
  'resumo', 'summary', 'about', 'perfil',
  'informações adicionais', 'additional information',
];

export async function pdfToMarkdown(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data }).promise;

  const allLines: TextLine[] = [];

  for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as TextItem[];
    const lines = groupItemsIntoLines(items);
    allLines.push(...lines);
  }

  return linesToMarkdown(allLines);
}

export function textToMarkdown(text: string): string {
  const lines = text.split('\n');
  const mdLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      mdLines.push('');
      continue;
    }

    if (isSectionHeading(trimmed)) {
      mdLines.push(`## ${cleanText(trimmed)}`);
    } else if (isBulletLine(trimmed)) {
      mdLines.push(`- ${cleanBullet(trimmed)}`);
    } else if (isNumberedItem(trimmed)) {
      mdLines.push(`- ${cleanNumbered(trimmed)}`);
    } else {
      mdLines.push(cleanText(trimmed));
    }
  }

  return mdLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function groupItemsIntoLines(items: TextItem[]): TextLine[] {
  if (!items || items.length === 0) return [];

  const sorted = items
    .filter(item => item && typeof item.str === 'string' && item.str.trim().length > 0 && Array.isArray(item.transform))
    .sort((a, b) => {
      const yA = a.transform[5] ?? 0;
      const yB = b.transform[5] ?? 0;
      if (Math.abs(yA - yB) < 3) return (a.transform[4] ?? 0) - (b.transform[4] ?? 0);
      return yB - yA;
    });

  const lines: TextLine[] = [];
  let currentLine: TextItem[] = [];
  let currentY = sorted[0]?.transform[5] ?? 0;

  for (const item of sorted) {
    const y = item.transform[5] ?? 0;
    if (Math.abs(y - currentY) > 3) {
      if (currentLine.length > 0) {
        lines.push(buildLine(currentLine, currentY));
      }
      currentLine = [item];
      currentY = y;
    } else {
      currentLine.push(item);
    }
  }

  if (currentLine.length > 0) {
    lines.push(buildLine(currentLine, currentY));
  }

  return lines;
}

function buildLine(items: TextItem[], y: number): TextLine {
  const sortedItems = items.sort((a, b) => (a.transform[4] ?? 0) - (b.transform[4] ?? 0));
  const text = sortedItems.map(i => i.str).join(' ').trim();
  const fontSize = Math.max(...items.map(i => Math.abs(i?.transform?.[0] || i?.transform?.[3] || 12)));
  const isBold = items.some(i =>
    i.fontName?.toLowerCase().includes('bold') ||
    i.fontName?.toLowerCase().includes('heavy')
  );

  return { y, items: sortedItems, text, fontSize, isBold: Boolean(isBold) };
}

function linesToMarkdown(lines: TextLine[]): string {
  if (lines.length === 0) return '';

  const fontSizes = lines.map(l => l.fontSize).filter(s => s > 0);
  const bodyFontSize = median(fontSizes) || 12;
  const mdLines: string[] = [];
  let prevWasEmpty = false;

  for (const line of lines) {
    const trimmed = line.text.trim();
    if (!trimmed) {
      if (!prevWasEmpty) mdLines.push('');
      prevWasEmpty = true;
      continue;
    }
    prevWasEmpty = false;

    const isHeading =
      line.fontSize > bodyFontSize * 1.3 ||
      (line.isBold && trimmed.length < 60) ||
      isSectionHeading(trimmed);

    if (isHeading) {
      mdLines.push(`## ${cleanText(trimmed)}`);
    } else if (isBulletLine(trimmed)) {
      mdLines.push(`- ${cleanBullet(trimmed)}`);
    } else if (isNumberedItem(trimmed)) {
      mdLines.push(`- ${cleanNumbered(trimmed)}`);
    } else {
      mdLines.push(cleanText(trimmed));
    }
  }

  return mdLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function isSectionHeading(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (lower.length > 80) return false;

  for (const keyword of SECTION_KEYWORDS) {
    if (lower === keyword || lower.startsWith(keyword) || lower.endsWith(keyword)) {
      return true;
    }
  }

  if (/^[A-ZÁÉÍÓÚÇ\s]{3,}$/.test(text.trim()) && text.trim().length < 40) {
    return true;
  }

  return false;
}

function isBulletLine(text: string): boolean {
  const trimmed = text.trim();
  return BULLET_CHARS.some(c => trimmed.startsWith(c)) || /^[•●○▶►→]\s/.test(trimmed);
}

function isNumberedItem(text: string): boolean {
  return /^\d+[.)]\s/.test(text.trim());
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/["“”]/g, '"')
    .replace(/['‘’]/g, "'")
    .trim();
}

function cleanBullet(text: string): string {
  return cleanText(text.replace(/^[\s•●○▶►→\-*]+/, ''));
}

function cleanNumbered(text: string): string {
  return cleanText(text.replace(/^\d+[.)]\s*/, ''));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
