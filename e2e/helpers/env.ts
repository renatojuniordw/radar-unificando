/**
 * Carrega variáveis de ambiente dos arquivos .env.local e .env para o
 * globalSetup do Playwright. O globalSetup roda FORA do Next.js, então não
 * herda o carregamento automático de env do runtime da app — lê aqui
 * manualmente (parse simples, sem dependência extra) e não sobrescreve
 * variáveis já definidas no ambiente.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_FILES = [".env.local", ".env"];

export function loadEnvFiles(): void {
  const root = process.cwd();
  for (const filename of ENV_FILES) {
    try {
      const content = readFileSync(resolve(root, filename), "utf8");
      for (const rawLine of content.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const match = line.match(/^([\w.]+)\s*=\s*(.*)$/);
        if (!match) continue;
        const key = match[1];
        let value = match[2].trim();
        // Remove aspas simples/duplas opcionais
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = value;
      }
    } catch {
      // Arquivo ausente/ilegível — segue sem ele
    }
  }
}