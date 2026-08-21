import { jobRepository } from "@/lib/infrastructure/repositories";
import { mapJobToApi } from "@/lib/core/jobs/map-job";
import { JobPostingSchema } from "@/components/seo/job-posting-schema";
import { BuscaClient } from "./busca-client";

const ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";

export const dynamic = "force-dynamic";

// Pré-carrega as primeiras vagas no servidor para que o conteúdo principal
// da página exista no HTML inicial (rastreável sem depender de hidratação JS).
// O client component refina/substitui esses dados conforme sessão e filtros.
export default async function BuscaPage() {
  const jobs = await jobRepository.findByUserId(ANONYMOUS_USER_ID, { take: 50 });
  const initialJobs = jobs.map((j) => mapJobToApi(j));

  return (
    <>
      {/* Renderizado no servidor com os mesmos dados iniciais: o schema
          client-side em JobTable cobre a lista pós-filtro, mas o Google não
          confia em JSON-LD injetado só após a hidratação — este garante que
          o HTML inicial já chega com JobPosting válido para o crawler. */}
      <JobPostingSchema
        jobs={initialJobs.map((j) => ({
          title: j.title,
          company: j.company,
          location: j.location,
          type: j.type,
          url: j.link,
          datePosted: j.detectedAt,
        }))}
      />
      <BuscaClient initialJobs={initialJobs} />
    </>
  );
}
