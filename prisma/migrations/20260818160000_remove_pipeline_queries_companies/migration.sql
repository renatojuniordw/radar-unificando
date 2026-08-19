-- Remove o armazenamento dos termos de busca (queries/companies) de
-- pipeline_runs: volume de dados + privacidade (LGPD). As métricas de
-- contagem do painel admin não dependem dessas colunas.
ALTER TABLE "pipeline_runs" DROP COLUMN "queries";
ALTER TABLE "pipeline_runs" DROP COLUMN "companies";