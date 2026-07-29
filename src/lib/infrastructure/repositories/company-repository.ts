import type Database from 'better-sqlite3';
import type { ICompanyRepository } from './types';

export class CompanyRepository implements ICompanyRepository {
  constructor(private readonly db: Database.Database) {}

  setList(names: string[]): Promise<void> {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM companies').run();
      const insert = this.db.prepare('INSERT OR IGNORE INTO companies (name) VALUES (?)');
      for (const name of names) {
        insert.run(name.trim());
      }
    });
    tx();
    return Promise.resolve();
  }

  findAll(): Promise<string[]> {
    const rows = this.db.prepare('SELECT name FROM companies ORDER BY name').all() as { name: string }[];
    return Promise.resolve(rows.map(r => r.name));
  }

  add(name: string): Promise<void> {
    this.db.prepare('INSERT OR IGNORE INTO companies (name) VALUES (?)').run(name.trim());
    return Promise.resolve();
  }

  remove(name: string): Promise<void> {
    this.db.prepare('DELETE FROM companies WHERE name = ?').run(name.trim());
    return Promise.resolve();
  }
}
