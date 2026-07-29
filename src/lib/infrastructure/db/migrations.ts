import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa TEXT NOT NULL,
      plataforma TEXT NOT NULL CHECK(plataforma IN ('Gupy', 'InHire')),
      na_lista TEXT DEFAULT 'Não' CHECK(na_lista IN ('Sim', 'Não')),
      cargo_categoria TEXT,
      titulo_vaga TEXT,
      tipo TEXT,
      local TEXT,
      link TEXT,
      nome_na_plataforma TEXT,
      publicado TEXT,
      alerta TEXT DEFAULT '',
      detectado_em TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(link)
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_plataforma ON jobs(plataforma);
    CREATE INDEX IF NOT EXISTS idx_jobs_empresa ON jobs(empresa);
    CREATE INDEX IF NOT EXISTS idx_jobs_cargo ON jobs(cargo_categoria);
    CREATE INDEX IF NOT EXISTS idx_jobs_na_lista ON jobs(na_lista);

    CREATE TABLE IF NOT EXISTS company_presence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa TEXT NOT NULL UNIQUE,
      tem_gupy TEXT DEFAULT '' CHECK(tem_gupy IN ('Sim', '')),
      pagina_gupy TEXT DEFAULT '',
      tem_inhire TEXT DEFAULT '' CHECK(tem_inhire IN ('Sim', '')),
      pagina_inhire TEXT DEFAULT '',
      total_vagas_inhire INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS new_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      total_vagas INTEGER DEFAULT 0,
      url_carreiras TEXT
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'interrupted')),
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT,
      total_jobs INTEGER DEFAULT 0,
      gupy_jobs INTEGER DEFAULT 0,
      inhire_jobs INTEGER DEFAULT 0,
      new_companies_found INTEGER DEFAULT 0,
      discovery_enabled INTEGER DEFAULT 1,
      log TEXT DEFAULT ''
    );
  `);
}
