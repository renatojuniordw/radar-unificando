export interface ParsedJob {
  title: string;
  company?: string;
  location?: string; // parte antes de " | " na linha 📍
  modality?: string; // parte depois de " | " na linha 📍
  date?: string; // texto após "Publicada em" na linha 📅
  link?: string; // URL extraída da linha 🔗
  description?: string;
}

export interface ParsedCourse {
  title: string;
  provider?: string; // "Alura" | "Udemy" (após " — " no título)
  skill?: string; // texto após "Skill:" na linha 📌
  price?: string; // texto da linha 💰
  link?: string; // URL extraída da linha 🔗
  description?: string;
}

export type ContentSegment =
  | { type: 'markdown'; text: string }
  | { type: 'job'; job: ParsedJob }
  | { type: 'course'; course: ParsedCourse };

const HEADER_START_RE = /^\s*🏢\u{FE0F}?\s*/u;
const COURSE_HEADER_RE = /^\s*📚\u{FE0F}?\s*/u;
const LOCATION_RE = /^\s*📍\s*(.*)$/u;
const DATE_RE = /^\s*📅\s*(?:publicada em\s*)?(.*)$/iu;
const LINK_RE = /^\s*🔗\s*(.*)$/u;
const SKILL_RE = /^\s*📌\s*(?:skill\s*:)?\s*(.*)$/iu;
const PRICE_RE = /^\s*💰\s*(.*)$/u;
const DESC_RE = /^\s*(?:\*\*)?Descri[çc][ãa]o(?:\*\*)?(?:\s*:)?\s*/iu;
const STOP_EMOJI_RE = /^\s*[📊📋]\s*/u;
const HEADING_RE = /^\s*#{1,3}\s/;

function parseHeader(line: string): { title: string; company?: string } | null {
  const rest = line.replace(HEADER_START_RE, '').replace(/\*\*/g, '').trim();
  if (!rest) return null;

  const dash = rest.match(/^(.*?)\s*[—–]\s*(.+)$/);
  if (dash) {
    const title = dash[1].trim();
    if (!title) return null;
    return { title, company: dash[2].trim() };
  }

  // Hífen espaçado (preserva títulos hifenizados como "Front-end")
  const hyphen = rest.match(/^(.*?)\s+-\s+(.+)$/);
  if (hyphen) {
    const title = hyphen[1].trim();
    if (!title) return null;
    return { title, company: hyphen[2].trim() };
  }

  return { title: rest };
}

function extractUrl(text: string): string | undefined {
  const md = text.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
  const candidate = md ? md[2].trim() : text.split(/\s+/)[0];
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return undefined;
}

function postProcessDescription(lines: string[]): string | undefined {
  const cleaned = lines.map((l) => l.replace(/\*\*/g, '').replace(/`/g, '').trim());
  while (cleaned.length && !cleaned[0]) cleaned.shift();
  while (cleaned.length && !cleaned[cleaned.length - 1]) cleaned.pop();
  if (!cleaned.length) return undefined;
  return cleaned.join('\n');
}

function parseBlock(
  lines: string[],
  startIndex: number,
): { job: ParsedJob; endIndex: number } | null {
  const header = parseHeader(lines[startIndex]);
  if (!header) return null;

  const job: ParsedJob = { title: header.title, company: header.company };
  let i = startIndex + 1;
  let mode: 'meta' | 'desc' = 'meta';
  const descLines: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    if (HEADER_START_RE.test(line) || HEADING_RE.test(line)) break;
    const trimmed = line.trim();

    if (mode === 'meta') {
      if (!trimmed) {
        i++;
        continue;
      }
      if (STOP_EMOJI_RE.test(trimmed)) break;
      if (DESC_RE.test(trimmed)) {
        const rest = trimmed.replace(DESC_RE, '');
        if (rest) descLines.push(rest);
        mode = 'desc';
        i++;
        continue;
      }
      const loc = trimmed.match(LOCATION_RE);
      if (loc) {
        const [left, right] = loc[1].split('|').map((s) => s.trim());
        if (left) job.location = left;
        if (right) job.modality = right;
        i++;
        continue;
      }
      const date = trimmed.match(DATE_RE);
      if (date) {
        const d = date[1].trim();
        if (d && !/^\[.*\]$/.test(d)) job.date = d;
        i++;
        continue;
      }
      const link = trimmed.match(LINK_RE);
      if (link) {
        const url = extractUrl(link[1].trim());
        if (url) job.link = url;
        i++;
        continue;
      }
      // Linha não-metadata/não-rótulo: prosa solta não entra no card.
      break;
    } else {
      if (STOP_EMOJI_RE.test(trimmed)) break;
      descLines.push(line);
      i++;
    }
  }

  // Card só é emitido se houver título e pelo menos link ou local.
  if (!job.title || (!job.link && !job.location)) return null;

  const description = postProcessDescription(descLines);
  if (description) job.description = description;

  return { job, endIndex: i };
}

function parseCourseBlock(
  lines: string[],
  startIndex: number,
): { course: ParsedCourse; endIndex: number } | null {
  const rest = lines[startIndex].replace(COURSE_HEADER_RE, '').replace(/\*\*/g, '').trim();
  if (!rest) return null;

  const course: ParsedCourse = { title: rest };
  const dash = rest.match(/^(.*?)\s*[—–]\s*(.+)$/);
  if (dash) {
    course.title = dash[1].trim();
    course.provider = dash[2].trim();
  }

  let i = startIndex + 1;
  let mode: 'meta' | 'desc' = 'meta';
  const descLines: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    if (COURSE_HEADER_RE.test(line) || HEADER_START_RE.test(line) || HEADING_RE.test(line)) break;
    const trimmed = line.trim();

    if (mode === 'meta') {
      if (!trimmed) {
        i++;
        continue;
      }
      if (STOP_EMOJI_RE.test(trimmed)) break;
      if (DESC_RE.test(trimmed)) {
        const restDesc = trimmed.replace(DESC_RE, '');
        if (restDesc) descLines.push(restDesc);
        mode = 'desc';
        i++;
        continue;
      }
      const skill = trimmed.match(SKILL_RE);
      if (skill) {
        const s = skill[1].trim();
        if (s) course.skill = s;
        i++;
        continue;
      }
      const price = trimmed.match(PRICE_RE);
      if (price) {
        const p = price[1].trim();
        if (p) course.price = p;
        i++;
        continue;
      }
      const link = trimmed.match(LINK_RE);
      if (link) {
        const url = extractUrl(link[1].trim());
        if (url) course.link = url;
        i++;
        continue;
      }
      // Linha não-metadata/não-rótulo: prosa solta não entra no card.
      break;
    } else {
      if (STOP_EMOJI_RE.test(trimmed)) break;
      descLines.push(line);
      i++;
    }
  }

  // Card só é emitido se houver título e link.
  if (!course.title || !course.link) return null;

  const description = postProcessDescription(descLines);
  if (description) course.description = description;

  return { course, endIndex: i };
}

export function parseJobCards(text: string): ContentSegment[] {
  const lines = text.split(/\r?\n/);
  const segments: ContentSegment[] = [];
  let i = 0;
  let mdStart = 0;

  const flushMarkdown = (endIndex: number) => {
    if (endIndex > mdStart) {
      const chunk = lines.slice(mdStart, endIndex).join('\n').trimEnd();
      if (chunk.trim()) segments.push({ type: 'markdown', text: chunk });
    }
  };

  while (i < lines.length) {
    if (COURSE_HEADER_RE.test(lines[i])) {
      const parsed = parseCourseBlock(lines, i);
      if (parsed) {
        flushMarkdown(i);
        segments.push({ type: 'course', course: parsed.course });
        i = parsed.endIndex;
        mdStart = parsed.endIndex;
        continue;
      }
    }
    if (HEADER_START_RE.test(lines[i])) {
      const parsed = parseBlock(lines, i);
      if (parsed) {
        flushMarkdown(i);
        segments.push({ type: 'job', job: parsed.job });
        i = parsed.endIndex;
        mdStart = parsed.endIndex;
        continue;
      }
    }
    i++;
  }

  flushMarkdown(lines.length);
  return segments;
}