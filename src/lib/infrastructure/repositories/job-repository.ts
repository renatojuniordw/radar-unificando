import type Database from 'better-sqlite3';
import type { JobData } from '@/types';
import type { IJobRepository, JobFilters } from './types';

export class JobRepository implements IJobRepository {
  constructor(private readonly db: Database.Database) {}

  upsertJobs(jobs: JobData[]): Promise<number> {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO jobs (empresa, plataforma, na_lista, cargo_categoria, titulo_vaga, tipo, local, link, nome_na_plataforma, publicado, alerta)
      VALUES (@empresa, @plataforma, @na_lista, @cargo_categoria, @titulo_vaga, @tipo, @local, @link, @nome_na_plataforma, @publicado, @alerta)
    `);

    let count = 0;
    const tx = this.db.transaction(() => {
      for (const job of jobs) {
        const result = insert.run(job);
        if (result.changes > 0) count++;
      }
    });
    tx();

    return Promise.resolve(count);
  }

  findAll(filters?: JobFilters): Promise<JobData[]> {
    let sql = 'SELECT * FROM jobs WHERE 1=1';
    const params: Record<string, unknown> = {};

    if (filters?.plataforma) {
      sql += ' AND plataforma = @plataforma';
      params.plataforma = filters.plataforma;
    }
    if (filters?.empresa) {
      sql += ' AND empresa LIKE @empresa';
      params.empresa = `%${filters.empresa}%`;
    }
    if (filters?.cargo_categoria) {
      sql += ' AND cargo_categoria = @cargo_categoria';
      params.cargo_categoria = filters.cargo_categoria;
    }
    if (filters?.na_lista) {
      sql += ' AND na_lista = @na_lista';
      params.na_lista = filters.na_lista;
    }
    if (filters?.search) {
      sql += ' AND (titulo_vaga LIKE @search OR empresa LIKE @search OR nome_na_plataforma LIKE @search)';
      params.search = `%${filters.search}%`;
    }

    sql += ' ORDER BY na_lista ASC, plataforma, empresa, cargo_categoria';

    const rows = this.db.prepare(sql).all(params) as JobData[];
    return Promise.resolve(rows);
  }

  replaceAll(jobs: JobData[]): Promise<void> {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM jobs').run();
      const insert = this.db.prepare(`
        INSERT INTO jobs (empresa, plataforma, na_lista, cargo_categoria, titulo_vaga, tipo, local, link, nome_na_plataforma, publicado, alerta, detectado_em)
        VALUES (@empresa, @plataforma, @na_lista, @cargo_categoria, @titulo_vaga, @tipo, @local, @link, @nome_na_plataforma, @publicado, @alerta, @detectado_em)
      `);
      for (const job of jobs) {
        insert.run(job);
      }
    });
    tx();
    return Promise.resolve();
  }

  stampDetectionDates(today: string): Promise<void> {
    this.db.prepare('UPDATE jobs SET detectado_em = COALESCE(detectado_em, ?) WHERE detectado_em IS NULL').run(today);
    return Promise.resolve();
  }

  getStats(): Promise<{ total: number; gupy: number; inhire: number }> {
    const total = (this.db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number }).count;
    const gupy = (this.db.prepare("SELECT COUNT(*) as count FROM jobs WHERE plataforma = 'Gupy'").get() as { count: number }).count;
    const inhire = (this.db.prepare("SELECT COUNT(*) as count FROM jobs WHERE plataforma = 'InHire'").get() as { count: number }).count;
    return Promise.resolve({ total, gupy, inhire });
  }

  getInhireTenantsForCompanies(companies: string[]): Promise<Array<{ empresa: string; slug: string; vagas: number }>> {
    if (companies.length === 0) return Promise.resolve([]);
    const placeholders = companies.map(() => '?').join(',');
    const rows = this.db.prepare(`
      SELECT DISTINCT empresa, nome_na_plataforma as slug, COUNT(*) as vagas
      FROM jobs
      WHERE plataforma = 'InHire' AND empresa IN (${placeholders})
      GROUP BY empresa, nome_na_plataforma
    `).all(...companies) as Array<{ empresa: string; slug: string; vagas: number }>;
    return Promise.resolve(rows);
  }
}
