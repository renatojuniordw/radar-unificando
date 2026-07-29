'use client';

import { useEffect, useState } from 'react';

interface Vaga {
  id: number;
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

export default function VagasPage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPlataforma, setFiltroPlataforma] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [cargos, setCargos] = useState<string[]>([]);

  async function carregarVagas() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroPlataforma) params.set('plataforma', filtroPlataforma);
    if (filtroCargo) params.set('cargo', filtroCargo);
    if (filtroBusca) params.set('search', filtroBusca);

    const query = params.toString();
    const res = await fetch(`/api/vagas${query ? '?' + query : ''}`);
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : [];
    setVagas(jobs);

    const uniqueCargos = [...new Set(jobs.map((j: Vaga) => j.cargo_categoria).filter(Boolean))] as string[];
    setCargos(uniqueCargos);
    setLoading(false);
  }

  useEffect(() => {
    carregarVagas();
  }, [filtroPlataforma, filtroCargo]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    carregarVagas();
  }

  function exportCsv() {
    window.open('/export?format=csv', '_blank');
  }

  return (
    <section className="py-16 bg-white border-t-8 border-slate-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block bg-slate-950 text-neon-yellow font-black uppercase tracking-widest text-[10px] px-3 py-1 border-2 border-slate-950 shadow-hard-md mb-4">
              VAGAS ENCONTRADAS
            </span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none text-slate-950">
              {vagas.length} VAGAS
            </h1>
          </div>
          <button
            onClick={exportCsv}
            className="bg-slate-950 text-neon-yellow px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-neon-yellow hover:text-slate-950 transition-colors border-4 border-slate-950 shadow-hard-sm"
          >
            EXPORTAR CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={filtroPlataforma}
            onChange={e => setFiltroPlataforma(e.target.value)}
            className="h-10 border-2 border-slate-950 bg-white px-3 text-xs font-black uppercase tracking-widest"
          >
            <option value="">TODAS PLATAFORMAS</option>
            <option value="Gupy">GUPY</option>
            <option value="InHire">INHIRE</option>
          </select>

          <select
            value={filtroCargo}
            onChange={e => setFiltroCargo(e.target.value)}
            className="h-10 border-2 border-slate-950 bg-white px-3 text-xs font-black uppercase tracking-widest"
          >
            <option value="">TODOS CARGOS</option>
            {cargos.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)}
              placeholder="Buscar empresa ou cargo..."
              className="h-10 border-2 border-slate-950 bg-white px-3 text-xs font-mono font-bold w-64"
            />
            <button
              type="submit"
              className="h-10 bg-slate-950 text-white px-4 font-black uppercase tracking-widest text-xs hover:bg-neon-yellow hover:text-slate-950 transition-colors border-2 border-slate-950"
            >
              BUSCAR
            </button>
          </form>
        </div>

        {/* Table */}
        {loading ? (
          <div className="w-full h-64 bg-slate-200 animate-pulse border-4 border-slate-950 shadow-hard-lg"></div>
        ) : vagas.length === 0 ? (
          <div className="p-12 border-4 border-dashed border-slate-950 text-center">
            <p className="font-black uppercase tracking-tighter text-2xl text-slate-400">NENHUMA VAGA ENCONTRADA</p>
            <p className="text-xs font-mono font-bold text-slate-400 mt-2">
              Execute o pipeline ou ajuste os filtros
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-4 border-slate-950 shadow-hard-lg">
            <table className="w-full border-collapse text-xs font-mono font-bold">
              <thead>
                <tr className="bg-slate-950 text-neon-yellow">
                  <th className="text-left p-3 border-r-2 border-slate-800">EMPRESA</th>
                  <th className="text-left p-3 border-r-2 border-slate-800">PLAT</th>
                  <th className="text-left p-3 border-r-2 border-slate-800">CARGO</th>
                  <th className="text-left p-3 border-r-2 border-slate-800">TÍTULO</th>
                  <th className="text-left p-3 border-r-2 border-slate-800">LOCAL</th>
                  <th className="text-left p-3 border-r-2 border-slate-800">LINK</th>
                  <th className="text-left p-3">ALERTA</th>
                </tr>
              </thead>
              <tbody>
                {vagas.map((vaga, i) => (
                  <tr
                    key={`${vaga.link}-${i}`}
                    className={`border-t-2 border-slate-950 ${vaga.na_lista === 'Sim' ? 'bg-neon-yellow/10' : ''} hover:bg-slate-100 transition-colors`}
                  >
                    <td className="p-3 border-r-2 border-slate-200">
                      <div className="flex items-center gap-2">
                        {vaga.na_lista === 'Sim' && (
                          <span className="bg-slate-950 text-neon-yellow text-[8px] font-black px-1 border border-slate-950">
                            LISTA
                          </span>
                        )}
                        {vaga.empresa}
                      </div>
                    </td>
                    <td className={`p-3 border-r-2 border-slate-200 font-black ${vaga.plataforma === 'Gupy' ? 'text-neon-yellow' : 'text-slate-950'}`}>
                      {vaga.plataforma}
                      <span className="block text-[8px] text-slate-400 font-mono">{vaga.nome_na_plataforma}</span>
                    </td>
                    <td className="p-3 border-r-2 border-slate-200 text-[9px]">{vaga.cargo_categoria}</td>
                    <td className="p-3 border-r-2 border-slate-200">{vaga.titulo_vaga}</td>
                    <td className="p-3 border-r-2 border-slate-200">{vaga.local}</td>
                    <td className="p-3 border-r-2 border-slate-200">
                      <a
                        href={vaga.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-950 text-neon-yellow px-2 py-1 text-[9px] font-black uppercase tracking-wider hover:bg-neon-yellow hover:text-slate-950 transition-colors border border-slate-950"
                      >
                        CANDIDATAR
                      </a>
                    </td>
                    <td className={`p-3 ${vaga.alerta ? 'text-danger font-black' : ''}`}>
                      {vaga.alerta || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
