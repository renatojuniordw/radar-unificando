'use client';

import { useEffect, useRef, useState } from 'react';

interface LogEntry {
  type: string;
  step?: string;
  message?: string;
  error?: string;
}

export default function PipelinePage() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/empresas').then(r => r.json()).then(data => {
      setCompanies(Array.isArray(data) ? data : []);
    }).catch(() => {});

    fetch('/api/pipeline/latest').then(r => r.json()).then(data => {
      if (data && data.id) {
        setLastRun(data.id);
        const status = data.status;
        const start = data.started_at ? new Date(data.started_at).toLocaleString('pt-BR') : '-';
        addLog({ type: 'info', message: `Última execução (${status}): ${start} — ${data.total_jobs} vagas` });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function addLog(entry: LogEntry) {
    setLogs(prev => [...prev, entry]);
  }

  async function handleStart() {
    setRunning(true);
    setLogs([]);
    addLog({ type: 'step_start', message: 'Iniciando pipeline...' });

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies,
          discoveryEnabled,
        }),
      });

      const { runId: id } = await res.json();
      setRunId(id);

      // Connect SSE
      const evtSource = new EventSource(`/api/pipeline/stream?runId=${id}`);

      evtSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as LogEntry;
          addLog(data);

          if (data.type === 'pipeline_complete' || data.type === 'pipeline_error' || data.type === 'pipeline_cancelled') {
            evtSource.close();
            setRunning(false);
          }
        } catch {
          // ignore parse errors
        }
      };

      evtSource.onerror = () => {
        evtSource.close();
        setRunning(false);
        addLog({ type: 'pipeline_error', message: 'Conexão perdida com o servidor' });
      };
    } catch (error) {
      addLog({ type: 'pipeline_error', message: `Erro ao iniciar: ${error instanceof Error ? error.message : 'desconhecido'}` });
      setRunning(false);
    }
  }

  function handleCancel() {
    if (runId) {
      fetch(`/api/pipeline/${runId}`, { method: 'POST' });
      addLog({ type: 'pipeline_cancelled', message: 'Cancelando...' });
    }
  }

  function getLogColor(type: string): string {
    switch (type) {
      case 'step_start': return 'text-neon-yellow';
      case 'step_progress': return 'text-slate-300';
      case 'step_complete': return 'text-success';
      case 'step_warn': return 'text-[#ffaa00]';
      case 'step_error': return 'text-danger';
      case 'pipeline_complete': return 'text-success';
      case 'pipeline_error': return 'text-danger';
      case 'pipeline_cancelled': return 'text-[#ffaa00]';
      default: return 'text-white';
    }
  }

  return (
    <section className="py-16 bg-white border-t-8 border-slate-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <span className="inline-block bg-slate-950 text-neon-yellow font-black uppercase tracking-widest text-[10px] px-3 py-1 border-2 border-slate-950 shadow-hard-md mb-4">
          PIPELINE
        </span>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950 mb-4">
          EXECUTAR PIPELINE
        </h1>
        <p className="text-xs font-mono font-bold text-slate-400 mb-12">
          Busca automática de vagas em Gupy e InHire. Pode levar alguns minutos.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="md:col-span-1">
            <div className="p-6 border-4 border-slate-950 bg-white shadow-hard-lg">
              <h2 className="text-lg font-black uppercase tracking-tighter mb-6">CONFIGURAÇÃO</h2>

              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2">EMPRESAS NA LISTA</p>
                <p className="text-sm font-mono font-bold">{companies.length} empresas</p>
                <a href="/empresas" className="text-[9px] font-black uppercase tracking-widest text-slate-950 underline mt-1 inline-block">
                  GERENCIAR
                </a>
              </div>

              <label className="flex items-center gap-3 mb-8 cursor-pointer">
                <button
                  onClick={() => setDiscoveryEnabled(!discoveryEnabled)}
                  className={`w-14 h-8 border-2 border-slate-950 transition-all relative ${discoveryEnabled ? 'bg-slate-950' : 'bg-white'}`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 border-2 border-slate-950 transition-all ${
                      discoveryEnabled ? 'right-1 bg-neon-yellow' : 'left-1 bg-slate-300'
                    }`}
                  />
                </button>
                <div>
                  <span className="text-xs font-black uppercase tracking-tighter">DESCOBRIR NOVAS</span>
                  <span className="block text-[9px] font-mono text-slate-400">Wayback + urlscan + CommonCrawl</span>
                </div>
              </label>

              {!running ? (
                <button
                  onClick={handleStart}
                  className="w-full bg-neon-yellow text-slate-950 py-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-[#b3ff00] transition-colors border-2 border-transparent shadow-hard-md"
                >
                  EXECUTAR
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="w-full bg-danger text-white py-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-[#ff3333] transition-colors border-2 border-slate-950 shadow-hard-md"
                >
                  CANCELAR
                </button>
              )}
            </div>
          </div>

          {/* Log */}
          <div className="md:col-span-2">
            <div className="border-4 border-slate-950 bg-slate-950 shadow-hard-lg" style={{ minHeight: '400px' }}>
              <div className="bg-slate-800 px-4 py-2 border-b-4 border-slate-950">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">LOG DA EXECUÇÃO</span>
              </div>
              <div className="p-4 font-mono text-xs h-96 overflow-y-auto space-y-1">
                {logs.length === 0 && !running && (
                  <p className="text-slate-600">Aguardando execução...</p>
                )}
                {logs.map((log, i) => (
                  <div key={i} className={getLogColor(log.type)}>
                    <span className="text-slate-600">[{log.step || '-'}]</span>{' '}
                    {log.message}
                    {log.error && <span className="text-danger ml-2">⚠ {log.error}</span>}
                  </div>
                ))}
                {running && (
                  <div className="text-slate-600 animate-pulse">Processando...</div>
                )}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Steps info */}
            <div className="mt-4 p-4 border-2 border-slate-950 bg-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">ETAPAS DO PIPELINE</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-mono font-bold">
                <span className="bg-slate-950 text-neon-yellow px-2 py-1 text-center">Gupy</span>
                <span className="bg-slate-950 text-neon-yellow px-2 py-1 text-center">InHire (lista)</span>
                <span className={`px-2 py-1 text-center border-2 border-slate-950 ${discoveryEnabled ? 'bg-neon-yellow text-slate-950' : 'bg-slate-200 text-slate-400'}`}>
                  Discovery
                </span>
                <span className="bg-slate-950 text-white px-2 py-1 text-center border-2 border-slate-950">Merge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
