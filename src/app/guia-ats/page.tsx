import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SITE } from '@/lib/core/constants';

export const revalidate = 86400; // ISR diário

export const metadata: Metadata = {
  title: 'Análise ATS de Currículo: o que é e como passar nos filtros automáticos',
  description:
    'Entenda o que é ATS (Applicant Tracking System), por que currículos são rejeitados automaticamente e as boas práticas para seu CV passar nos filtros — com análise gratuita no Radar Unificando.',
  alternates: { canonical: `${SITE.url}/guia-ats` },
};

const faq = [
  {
    question: 'O que é ATS?',
    answer:
      'ATS (Applicant Tracking System) é o software que empresas usam para receber e filtrar currículos automaticamente. Ele faz o parse do documento e busca palavras-chave da vaga — se o currículo não for legível ou não tiver as keywords certas, pode ser descartado antes de um humano ver.',
  },
  {
    question: 'O que elimina um currículo no ATS?',
    answer:
      'Formatação que o parser não lê (colunas, tabelas, imagens), falta de seções padrão (Experiência, Formação, Habilidades), ausência de dados de contato, e-mail genérico, falta de palavras-chave da vaga e ausência de resultados mensuráveis.',
  },
  {
    question: 'Como saber se meu currículo passa no ATS?',
    answer:
      'Use a análise ATS gratuita do Radar Unificando: importe seu currículo, opcionalmente cole a descrição da vaga alvo, e receba um score 0-100 com checklist, palavras-chave faltando e recomendações.',
  },
  {
    question: 'A análise ATS é garantia de passar em um processo?',
    answer:
      'Não. Cada empresa usa um ATS diferente e o algoritmo é secreto. A análise segue boas práticas reconhecidas para maximizar suas chances — mas não é garantia de aprovação.',
  },
];

export default function GuiaAtsPage() {
  return (
    <Box sx={{ bgcolor: '#020617', color: '#ffffff', minHeight: '100vh', py: { xs: 6, md: 8 } }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          }),
        }}
      />
      <Container maxWidth="md">
        <Typography
          component="h1"
          sx={{ fontWeight: 900, fontSize: { xs: '1.8rem', sm: '2.5rem' }, letterSpacing: '-0.03em', textTransform: 'uppercase', mb: 2, color: '#ffffff' }}
        >
          ANÁLISE ATS DE CURRÍCULO
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>
          Seu currículo está sendo rejeitado antes de um humano ler? Entenda como funcionam os filtros
          automáticos e o que fazer para passar.
        </Typography>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#ccff00', mb: 1 }}>
            O que é ATS
          </Typography>
          <Typography sx={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
            ATS (Applicant Tracking System) é o sistema que empresas usam para receber, organizar e filtrar
            currículos. A maioria dos processos seletivos — inclusive nas maiores empresas do Brasil — usa
            algum tipo de filtro automático. O software lê o documento, extrai os dados e busca as
            palavras-chave da vaga. Se o seu currículo não está no formato certo ou não tem as keywords,
            ele pode ser descartado silenciosamente.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#ccff00', mb: 1 }}>
            Os erros mais comuns
          </Typography>
          <ul style={{ color: '#e2e8f0', fontSize: '0.9rem', paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Formatação ilegível:</strong> colunas, tabelas, imagens e fontes incomuns quebram o parser.</li>
            <li><strong>Sem seções padrão:</strong> Experiência, Formação e Habilidades precisam estar claras.</li>
            <li><strong>Sem dados de contato:</strong> e-mail e telefone são obrigatórios.</li>
            <li><strong>E-mail genérico:</strong> gmail.com passa menos profissionalismo.</li>
            <li><strong>Sem palavras-chave:</strong> skills e ferramentas da vaga precisam aparecer no texto.</li>
            <li><strong>Sem métricas:</strong> “aumentei vendas” vale menos que “aumentei vendas em 30%”.</li>
          </ul>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#ccff00', mb: 1 }}>
            Como passar no ATS
          </Typography>
          <ul style={{ color: '#e2e8f0', fontSize: '0.9rem', paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Use formato de texto simples e seções bem definidas.</li>
            <li>Inclua as palavras-chave exatas da vaga (cargos, skills, ferramentas).</li>
            <li>Quantifique resultados com números.</li>
            <li>Mantenha 1-2 páginas.</li>
            <li>Adapte o currículo para cada vaga — um currículo genérico compete no modo difícil.</li>
          </ul>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#ccff00', mb: 1 }}>
            Perguntas frequentes
          </Typography>
          {faq.map((f) => (
            <Box key={f.question} sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>{f.question}</Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{f.answer}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 5, p: 4, border: '2px solid #ccff00', boxShadow: '6px 6px 0px #ccff00', bgcolor: '#0f172a' }}>
          <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', color: '#ccff00', mb: 2 }}>
            ANALISE SEU CURRÍCULO AGORA
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 3 }}>
            Importe seu currículo e receba o score ATS gratuito com palavras-chave faltando e recomendações.
          </Typography>
          <Link
            href="/perfil"
            style={{
              display: 'inline-block',
              backgroundColor: '#ccff00',
              color: '#020617',
              padding: '14px 28px',
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              textDecoration: 'none',
              boxShadow: '4px 4px 0px #ffffff',
            }}
          >
            Importar currículo
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
