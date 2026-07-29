import type Database from 'better-sqlite3';
import type { NewCompany } from '@/types';
import type { INewCompanyRepository } from './types';

export class NewCompanyRepository implements INewCompanyRepository {
  constructor(private readonly db: Database.Database) {}

  replaceAll(companies: NewCompany[]): Promise<void> {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM new_companies').run();
      const insert = this.db.prepare('INSERT INTO new_companies (nome, total_vagas, url_carreiras) VALUES (?, ?, ?)');
      for (const c of companies) {
        insert.run(c.nome, c.total_vagas, c.url_carreiras);
      }
    });
    tx();
    return Promise.resolve();
  }

  findAll(): Promise<NewCompany[]> {
    const rows = this.db.prepare('SELECT * FROM new_companies ORDER BY total_vagas DESC').all() as NewCompany[];
    return Promise.resolve(rows);
  }
}
