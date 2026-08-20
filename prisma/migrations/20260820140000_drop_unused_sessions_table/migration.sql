-- Remove a tabela "sessions" (model Prisma `Session`), que nunca era
-- populada em código (app usa estratégia JWT pura do Auth.js) e só era
-- referenciada num deleteMany() redundante em user-repository.ts, já
-- coberto pelo ON DELETE CASCADE de outras tabelas.
DROP TABLE "sessions";
