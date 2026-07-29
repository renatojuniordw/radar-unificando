export class TextUtils {
  normalize(s: string): string {
    return String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  compact(s: string): string {
    return this.normalize(String(s))
      .toLowerCase()
      .replace(/&/g, ' e ')
      .replace(/[^a-z0-9]+/g, '');
  }

  tokens(s: string): string[] {
    return this.normalize(String(s))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  slugify(s: string): string {
    return (
      this.normalize(String(s))
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'vaga'
    );
  }
}

export const textUtils = new TextUtils();
