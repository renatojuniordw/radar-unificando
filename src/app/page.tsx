'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Box, Typography, Snackbar } from '@mui/material';
import { AnonymousStorage } from '@/lib/infrastructure/storage/local-storage';
import { CompanyInput } from '@/components/company-input';
import { CargoInput } from '@/components/cargo-input';
import { VagaTable } from '@/components/vaga-table';
import { MatchDialog } from '@/components/match-dialog';
interface Vaga {
  id?: number;
  empresa: string;
  plataforma: string;
  na_lista: string;
  cargo_categoria: string;
  titulo_vaga: string;
  tipo: string;
  local: string;
  link: string;
  nome_na_plataforma: string;
  publicado: string;
  alerta: string;
  detectado_em: string;
}

const SUGGESTED_CARGOS = ['Analista de Dados', 'Data Engineer', 'Growth', 'BI Analyst', 'Data Scientist'];

const ROTATING_WORDS = ['Dados', 'BI', 'Business', 'Growth', 'Engenharia'];

function RotatingText() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 200);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={visible ? 'hero-word' : ''}
      style={{
        color: '#ccff00',
        fontWeight: 900,
        display: 'inline-block',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s',
      }}
    >
      {ROTATING_WORDS[index]}
    </span>
  );
}

function StatsBar({ totalVagas }: { totalVagas: number }) {
  const stats = [`${totalVagas}+ vagas disponíveis`, '50+ empresas monitoradas', 'Gupy + InHire'];
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 3 }}>
      {stats.map((label, i) => (
        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {i > 0 && <Box sx={{ color: '#334155', fontSize: '0.75rem' }}>·</Box>}
          <Typography
            sx={{
              color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.05em', fontSize: 11, fontFamily: 'ui-monospace, monospace',
            }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [cargosBusca, setCargosBusca] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [cargos, setCargos] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedJob, setSelectedJob] = useState<{ id: string; empresa: string; titulo: string; score: number } | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [vagasCount, setVagasCount] = useState(1200);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/vagas?limit=1').then(r => r.json()).then((data: Vaga[]) => {
      if (Array.isArray(data) && data.length > 0) setVagasCount(prev => prev + 1);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!session && vagas.length === 0) {
      const stored = AnonymousStorage.getVagas();
      if (stored.length > 0) setVagas(stored as Vaga[]);
    }
  }, [session]);

  useEffect(() => {
    const endsAt = AnonymousStorage.getCooldownEnd();
    if (endsAt) {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (remaining > 0) setCooldown(remaining);
      else AnonymousStorage.clearCooldown();
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          AnonymousStorage.clearCooldown();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown > 0]);

  async function carregarVagas(filters?: { plataforma?: string; cargo?: string; search?: string }) {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters?.plataforma) params.set('plataforma', filters.plataforma);
    if (filters?.cargo) params.set('cargo', filters.cargo);
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString();
    const res = await fetch(`/api/vagas${query ? '?' + query : ''}`);
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : [];
    setVagas(jobs);

    if (!session && jobs.length > 0) AnonymousStorage.setVagas(jobs);

    const uniqueCargos = [...new Set(jobs.map((j: Vaga) => j.cargo_categoria).filter(Boolean))] as string[];
    setCargos(uniqueCargos);
    setLoading(false);

    if (session && jobs.length > 0) {
      fetch('/api/match').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, number> = {};
          for (const m of data) map[String(m.jobId)] = m.score;
          setScores(map);
        }
      }).catch(() => {});
    }
  }

  function addSuggestion(cargo: string) {
    if (!cargosBusca.includes(cargo)) {
      setCargosBusca([...cargosBusca, cargo]);
    }
  }

  async function handleStart() {
    setRunning(true);
    setVagas([]);
    if (!session) AnonymousStorage.clear();

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: empresas, queries: cargosBusca }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429 && body.retryAfter) {
          const endsAt = Date.now() + body.retryAfter * 1000;
          AnonymousStorage.setCooldownEnd(endsAt);
          setCooldown(body.retryAfter);
          setSnackbar({ message: body.error || 'Muitas requisições. Aguarde.', severity: 'info' });
        } else {
          setSnackbar({ message: body.error || 'Erro ao iniciar pipeline', severity: 'error' });
        }
        setRunning(false);
        return;
      }

      const { runId: id, cooldownSeconds: cd } = await res.json();
      if (cd) {
        const endsAt = Date.now() + cd * 1000;
        AnonymousStorage.setCooldownEnd(endsAt);
        setCooldown(cd);
      }
      const evtSource = new EventSource(`/api/pipeline/stream?runId=${id}`);

      evtSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'pipeline_complete' || data.type === 'pipeline_error' || data.type === 'pipeline_cancelled') {
            evtSource.close();
            setRunning(false);

            if (!session && data.type === 'pipeline_complete' && Array.isArray(data.jobs)) {
              const jobs: Vaga[] = data.jobs.map((j: any) => ({ ...j, detectado_em: j.detectado_em || '' }));
              setVagas(jobs);
              AnonymousStorage.setVagas(data.jobs);
              const uniqueCargos = [...new Set(jobs.map((j: Vaga) => j.cargo_categoria).filter(Boolean))];
              setCargos(uniqueCargos);
            } else {
              carregarVagas();
            }

            setSnackbar({
              message: data.message || 'Pipeline concluído!',
              severity: data.type === 'pipeline_complete' ? 'success' : 'error',
            });
          }
        } catch { /* ignore */ }
      };

      evtSource.onerror = () => {
        evtSource.close();
        setRunning(false);
        carregarVagas();
      };
    } catch {
      setSnackbar({ message: 'Erro ao iniciar pipeline', severity: 'error' });
      setRunning(false);
    }
  }

  return (
    <>
      <Box
        ref={heroRef}
        className="section-hero"
        sx={{
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          className="hero-radar"
          sx={{
            position: 'absolute',
            inset: -200,
            background: 'conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)',
            opacity: 0.04,
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 }, position: 'relative', zIndex: 1 }}>
          <Box
            className="badge-neon"
            sx={{ mb: 1 }}
          >
            GUPY + INHIRE · GRÁTIS
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3, alignItems: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1,
                border: '2px solid #334155', px: 1.5, py: 0.5,
              }}
            >
              <span style={{ fontSize: '0.6rem', lineHeight: 1 }}>⚡</span>
              <span
                style={{
                  color: '#94a3b8', fontSize: '0.55rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  fontFamily: 'ui-monospace, monospace', lineHeight: 1,
                }}
              >
                Sem filtros: até 500 vagas aleatórias
              </span>
            </Box>
          </Box>

          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#ccff00',
              fontSize: { xs: '2.5rem', md: '5rem', lg: '7rem' },
              lineHeight: 0.9,
              textTransform: 'uppercase',
              mb: 2,
            }}
          >
            RADAR
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>{' '}</Box>
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}><br /></Box>
            DE VAGAS
          </Typography>

          <Typography
            sx={{
              mb: 4,
              maxWidth: 600,
              color: '#94a3b8',
              fontSize: { xs: '0.85rem', md: '0.95rem' },
              fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1.6,
            }}
          >
            Vagas de <RotatingText /> em{' '}
            <Box component="span" sx={{ color: 'white' }}>Gupy</Box> e{' '}
            <Box component="span" sx={{ color: 'white' }}>InHire</Box>, em tempo real.
          </Typography>

          <Typography
            sx={{
              mb: 1.5, color: '#64748b', fontWeight: 700, fontSize: '0.65rem',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            Empresas e cargos são opcionais — deixe em branco pra buscar tudo. Enter ou vírgula para adicionar.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 280 }}>
              <CompanyInput value={empresas} onChange={setEmpresas} autoFocus dark compact />
            </Box>
            <Box sx={{ flex: 1, minWidth: 280 }}>
              <CargoInput value={cargosBusca} onChange={setCargosBusca} dark compact />
            </Box>
          </Box>

          {cooldown > 0 && (
            <Typography sx={{ display: 'block', mt: 1.5, color: '#ccff00', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace' }}>
              ⏱ Limite de buscas atingido. Aguarde {Math.floor(cooldown / 60)}min {cooldown % 60}s.
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleStart}
              disabled={running || cooldown > 0}
              className="btn-neon"
              style={{ padding: '12px 32px', fontSize: '0.85rem' }}
            >
              {running ? 'BUSCANDO...' : cooldown > 0 ? `AGUARDAR ${Math.floor(cooldown / 60)}min ${cooldown % 60}s` : 'EXECUTAR BUSCA'}
            </button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.55rem', fontFamily: 'ui-monospace, monospace' }}>
              Sugestões:
            </Typography>
            {SUGGESTED_CARGOS.map(s => (
              <button
                key={s}
                onClick={() => addSuggestion(s)}
                style={{
                  fontWeight: 700, fontSize: '0.6rem', cursor: 'pointer',
                  border: '1px solid #334155', color: '#64748b',
                  background: 'transparent', padding: '3px 8px',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  fontFamily: 'ui-monospace, monospace',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ccff00'; e.currentTarget.style.color = '#ccff00'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b'; }}
              >
                {s}
              </button>
            ))}
          </Box>

          {!session && (
            <Typography sx={{ mt: 3, color: '#334155', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace' }}>
              Crie uma conta para salvar resultados e acompanhar candidaturas.
            </Typography>
          )}

          <StatsBar totalVagas={vagasCount} />
        </Container>
      </Box>

      {running && (
        <Box
          sx={{
            position: 'fixed', inset: 0, zIndex: 9999,
            bgcolor: 'rgba(2, 6, 23, 0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3,
          }}
        >
          <Box
            className="hero-radar"
            sx={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, transparent 0%, #ccff00 25%, transparent 50%)',
              opacity: 0.6,
            }}
          />
          <Typography sx={{ color: '#ccff00', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace' }}>
            Buscando vagas...
          </Typography>
          <Typography sx={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Gupy · InHire
          </Typography>
        </Box>
      )}

      <Box className="section-white">
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <VagaTable
            vagas={vagas}
            loading={loading}
            cargos={cargos}
            scores={scores}
            session={session}
            onJobClick={setSelectedJob}
            onExportCsv={() => window.open('/export?format=csv', '_blank')}
            onFilterChange={carregarVagas}
          />
        </Container>
      </Box>

      <Box className="section-white" sx={{ borderTop: '4px solid #020617' }}>
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
          <Box className="badge-dark" sx={{ mb: 4 }}>
            POR QUE USAR
          </Box>
          <Typography
            component="h2"
            sx={{
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: '#020617',
              fontSize: { xs: '2rem', md: '3rem' },
              mb: 6,
              lineHeight: 0.9,
            }}
          >
            RADAR DE VAGAS<br />NA SUA MÃO
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[
              { title: '100% GRATUITO', desc: 'Sem taxas escondidas e sem limite de buscas para contas cadastradas.' },
              { title: 'SEM CADASTRO OBRIGATÓRIO', desc: 'Busque sem criar conta. Os resultados ficam salvos localmente no seu navegador.' },
              { title: 'DADOS EM TEMPO REAL', desc: 'Consulta direta em Gupy e InHire no momento da busca — sem base pré-carregada.' },
            ].map(item => (
              <Box key={item.title} className="card-brutalist" sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '1.1rem', mb: 1.5, color: '#020617' }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box className="section-faq">
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
          <Box
            className="badge-dark"
            sx={{ mb: 4 }}
          >
            FAQ
          </Box>
          <Typography
            component="h2"
            sx={{
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: '#020617',
              fontSize: { xs: '2rem', md: '3rem' },
              mb: 6,
              lineHeight: 0.9,
            }}
          >
            PERGUNTAS<br />FREQUENTES
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
            {[
              {
                q: 'COMO FUNCIONA O RADAR DE VAGAS?',
                a: 'Buscamos automaticamente vagas publicadas nas plataformas Gupy e InHire usando inteligência de dados. Basta definir empresas e cargos de interesse e executar a busca. Os resultados são exibidos em tempo real.',
              },
              {
                q: 'PRECISO CRIAR UMA CONTA?',
                a: 'Não. Você pode buscar vagas sem cadastro. Criar uma conta permite salvar empresas favoritas, acompanhar candidaturas e ver o score de match entre seu perfil e as vagas encontradas.',
              },
              {
                q: 'AS VAGAS SÃO ATUALIZADAS COM QUE FREQUÊNCIA?',
                a: 'Cada busca consulta as plataformas em tempo real. Os resultados refletem as vagas disponíveis no momento da execução. Não há um banco de dados pré-carregado — você decide quando buscar.',
              },
              {
                q: 'MEUS DADOS ESTÃO SEGUROS?',
                a: 'Sim. Não armazenamos informações pessoais sem seu consentimento. Usuários logados têm dados criptografados e protegidos. Usuários anônimos têm dados armazenados apenas localmente no navegador.',
              },
            ].map(faq => (
              <details key={faq.q} className="faq-item">
                <summary>
                  <span>{faq.q}</span>
                  <span className="faq-arrow">↓</span>
                </summary>
                <div className="faq-content">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </Box>
        </Container>
      </Box>

      {snackbar && (
        <Snackbar
          open autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      )}

      <MatchDialog
        job={selectedJob}
        session={!!session}
        onClose={() => setSelectedJob(null)}
        onSnackbar={(message, severity) => setSnackbar({ message, severity })}
      />
    </>
  );
}
