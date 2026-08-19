import { jobRepository } from "@/lib/infrastructure/repositories";
import { mapJobToApi } from "@/lib/core/jobs/map-job";
import { BuscaClient } from "./busca-client";

const ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";

export const dynamic = "force-dynamic";

// Pré-carrega as primeiras vagas no servidor para que o conteúdo principal
// da página exista no HTML inicial (rastreável sem depender de hidratação JS).
// O client component refina/substitui esses dados conforme sessão e filtros.
export default async function BuscaPage() {
  const jobs = await jobRepository.findByUserId(ANONYMOUS_USER_ID, { take: 50 });
  const initialJobs = jobs.map((j) => mapJobToApi(j));

  return <BuscaClient initialJobs={initialJobs} />;
}
