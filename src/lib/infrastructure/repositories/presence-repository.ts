import type Database from 'better-sqlite3';
import type { CompanyPresence } from '@/types';
import type { IPresenceRepository } from './types';

export class PresenceRepository implements IPresenceRepository {
  constructor(private readonly db: Database.Database) {}

  buildPresence(
    companies: string[],
    gupyEntries: Array<{ empresa: string; url: string }>,
    inhireTenants: Array<{ empresa: string; slug: string; vagas: number }>
  ): Promise<void> {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM company_presence').run();
      const insert = this.db.prepare(`
        INSERT INTO company_presence (empresa, tem_gupy, pagina_gupy, tem_inhire, pagina_inhire, total_vagas_inhire)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const gupyMap = new Map(gupyEntries.map(g => [g.empresa, g.url]));
      const inhireMap = new Map(inhireTenants.map(i => [i.empresa, { slug: i.slug, vagas: i.vagas }]));

      for (const empresa of companies) {
        const gupyUrl = gupyMap.get(empresa);
        const inhireData = inhireMap.get(empresa);
        insert.run(
          empresa,
          gupyUrl ? 'Sim' : '',
          gupyUrl || '',
          inhireData ? 'Sim' : '',
          inhireData ? `https://${inhireData.slug}.inhire.app/vagas` : '',
          inhireData?.vagas || 0
        );
      }
    });
    tx();
    return Promise.resolve();
  }

  findAll(): Promise<CompanyPresence[]> {
    const rows = this.db.prepare('SELECT * FROM company_presence ORDER BY empresa').all() as CompanyPresence[];
    return Promise.resolve(rows);
  }
}
