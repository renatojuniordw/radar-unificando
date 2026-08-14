import { removeAccents } from '@/lib/utils/string';

/** Normaliza um texto para slug de URL (lowercase, sem acentos, hífens). */
export function slugify(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}