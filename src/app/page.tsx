'use client';

import { useEffect, useState } from 'react';

interface Stats {
  total: number;
  gupy: number;
  inhire: number;
}

interface LastRun {
  id: string;
  status: string;
  started_at: string;
  finished_at: string;
  total_jobs: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/vagas').then(r => r.json()).then(data => {
      const jobs = Array.isArray(data) ? data : [];
      setStats({
        total: jobs.length,
        gupy: jobs.filter((j: { plataforma: string }) => j.plataforma === 'Gupy').length,
        inhire: jobs.filter((j: { plataforma: string }) => j.plataforma === 'InHire').length,
      });
    }).catch(() => setStats({ total: 0, gupy: 0, inhire: 0 }));

    fetch('/api/empresas').then(r => r.json()).then(data => {
      setCompanies(Array.isArray(data) ? data : []);
    }).catch(() => setCompanies([]));

    // Try to get latest run
    fetch('/api/pipeline/latest').then(r => r.json()).then(data => {
      if (data && data.id) setLastRun(data);
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-neon-yellow border-b-4 border-slate-950 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <span className="inline-block bg-slate-950 text-neon-yellow font-black uppercase tracking-widest text-[10px] px-3 py-1 border-2 border-slate-950 shadow-hard-md mb-6">
            DASHBOARD
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-slate-950">
            RADAR<br />UNIFICANDO
          </h1>
          <p className="text-sm font-mono font-bold uppercase text-slate-900 mt-4 max-w-2xl">
            Vagas 100% remotas em Gupy e InHire para cargos de Dados, BI, Business e Growth.
          </p>
          <div className="flex gap-4 mt-8">
            <a
              href="/pipeline"
              className="bg-slate-950 text-neon-yellow px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-neon-yellow hover:text-slate-950 transition-colors border-4 border-slate-950 shadow-hard-md"
            >
              EXECUTAR PIPELINE
            </a>
            <a
              href="/vagas"
              className="bg-white text-slate-950 px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors border-4 border-slate-950 shadow-hard-md"
            >
              VER VAGAS
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-t-8 border-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950 mb-12">
            RESUMO
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <StatCard label="TOTAL DE VAGAS" value={stats?.total ?? '-'} active />
            <StatCard label="GUPY" value={stats?.gupy ?? '-'} active={!!stats?.gupy} />
            <StatCard label="INHIRE" value={stats?.inhire ?? '-'} active={!!stats?.inhire} />
            <StatCard label="EMPRESAS" value={companies.length || '-'} active={companies.length > 0} />
          </div>

          {lastRun && (
            <div className="mt-12 p-6 border-4 border-slate-950 bg-slate-100 shadow-hard-md">
              <span className="bg-slate-950 text-neon-yellow font-black uppercase tracking-widest text-[10px] px-2 py-1 border-2 border-slate-950 shadow-hard-sm">
                ÚLTIMA EXECUÇÃO
              </span>
              <p className="mt-4 font-mono font-bold text-sm">
                Status: {lastRun.status} — {new Date(lastRun.started_at).toLocaleString('pt-BR')}
                {lastRun.finished_at && ` — ${new Date(lastRun.finished_at).toLocaleString('pt-BR')}`}
              </p>
              <p className="font-mono font-bold text-sm mt-1">
                {lastRun.total_jobs} vagas encontradas
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-slate-950 border-t-8 border-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            <ActionCard
              href="/pipeline"
              title="EXECUTAR PIPELINE"
              desc="Inicie a busca automática de vagas em Gupy e InHire"
            />
            <ActionCard
              href="/vagas"
              title="EXPLORAR VAGAS"
              desc="Veja todas as vagas encontradas, filtre por plataforma ou cargo"
            />
            <ActionCard
              href="/empresas"
              title="GERENCIAR EMPRESAS"
              desc="Adicione empresas à sua lista para marcar vagas de interesse"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, active }: { label: string; value: string | number; active: boolean }) {
  return (
    <div className={`p-8 border-4 border-slate-950 ${active ? 'bg-neon-yellow shadow-hard-lg' : 'bg-white border-dashed opacity-70'} hover:-translate-y-1 transition-transform`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-2">{label}</p>
      <p className="text-5xl font-black uppercase tracking-tighter leading-none text-slate-950">{value}</p>
    </div>
  );
}

function ActionCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      className="p-8 border-4 border-neon-yellow bg-slate-950 text-white shadow-hard-neon hover:-translate-y-2 transition-all block"
    >
      <p className="text-xl font-black uppercase tracking-tighter leading-none mb-4">{title}</p>
      <p className="text-xs font-mono font-bold text-slate-400">{desc}</p>
    </a>
  );
}
