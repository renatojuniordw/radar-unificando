-- Rename PT-BR columns to English, preserving data via RENAME COLUMN.

-- AlterTable: company_presence
ALTER TABLE "company_presence" RENAME COLUMN "empresa" TO "company";
ALTER TABLE "company_presence" RENAME COLUMN "tem_gupy" TO "has_gupy";
ALTER TABLE "company_presence" RENAME COLUMN "pagina_gupy" TO "gupy_page";
ALTER TABLE "company_presence" RENAME COLUMN "tem_inhire" TO "has_inhire";
ALTER TABLE "company_presence" RENAME COLUMN "pagina_inhire" TO "inhire_page";
ALTER TABLE "company_presence" RENAME COLUMN "total_vagas_inhire" TO "total_inhire_jobs";

-- AlterTable: jobs
ALTER TABLE "jobs" RENAME COLUMN "empresa" TO "company";
ALTER TABLE "jobs" RENAME COLUMN "plataforma" TO "platform";
ALTER TABLE "jobs" RENAME COLUMN "na_lista" TO "on_list";
ALTER TABLE "jobs" RENAME COLUMN "cargo_categoria" TO "role_category";
ALTER TABLE "jobs" RENAME COLUMN "titulo_vaga" TO "title";
ALTER TABLE "jobs" RENAME COLUMN "tipo" TO "type";
ALTER TABLE "jobs" RENAME COLUMN "local" TO "location";
ALTER TABLE "jobs" RENAME COLUMN "nome_na_plataforma" TO "company_name_on_platform";
ALTER TABLE "jobs" RENAME COLUMN "publicado" TO "posted_at";
ALTER TABLE "jobs" RENAME COLUMN "descricao" TO "description";
ALTER TABLE "jobs" RENAME COLUMN "alerta" TO "alert";
ALTER TABLE "jobs" RENAME COLUMN "detectado_em" TO "detected_at";

-- AlterTable: new_companies
ALTER TABLE "new_companies" RENAME COLUMN "nome" TO "name";
ALTER TABLE "new_companies" RENAME COLUMN "total_vagas" TO "total_jobs";
ALTER TABLE "new_companies" RENAME COLUMN "url_carreiras" TO "careers_url";
