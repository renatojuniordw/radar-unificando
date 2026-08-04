export interface JobPostingData {
  title: string;
  company: string;
  location: string;
  type: string;
  url: string;
  datePosted?: string;
  description?: string;
}

export function JobPostingSchema({ jobs }: { jobs: JobPostingData[] }) {
  if (!jobs || jobs.length === 0) return null;

  // Gerar até 10 esquemas JobPosting para as primeiras vagas visíveis
  const schemas = jobs.slice(0, 10).map((job) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `Vaga de ${job.title} na empresa ${job.company} via plataforma ${job.location || 'Gupy/InHire'}.`,
    datePosted: job.datePosted || new Date().toISOString(),
    validThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
    employmentType: job.type?.toLowerCase().includes('remoto') ? 'FULL_TIME' : 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      sameAs: job.url,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'BR',
        addressLocality: job.location || 'Brasil',
      },
    },
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'BR',
    },
    jobLocationType: job.type?.toLowerCase().includes('remoto') ? 'TELECOMMUTE' : undefined,
    directApply: true,
  }));

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
