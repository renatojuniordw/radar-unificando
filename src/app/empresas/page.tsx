'use client';

import { useEffect, useState } from 'react';

interface Presence {
  empresa: string;
  tem_gupy: string;
  pagina_gupy: string;
  tem_inhire: string;
  pagina_inhire: string;
  total_vagas_inhire: number;
}

export default function EmpresasPage() {
  const [text, setText] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/empresas').then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : [];
      setCompanies(list);
      setText(list.join('\n'));
    });

    loadPresence();
  }, []);

  async function loadPresence() {
    try {
      const res = await fetch('/api/presence');
      const data = await res.json();
      setPresence(Array.isArray(data) ? data : []);
    } catch {
      setPresence([]);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    const names = text.split('\n').map(s => s.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/empresas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: names }),
      });

      if (res.ok) {
        setCompanies(names);
        setMessage(`${names.length} empresas salvas!`);
        loadPresence();
      } else {
        const err = await res.json();
        setMessage(`Erro: ${err.error}`);
      }
    } catch {
      setMessage('Erro ao salvar');
    }

    setSaving(false);
  }

  return (
    <section className="py-16 bg-white border-t-8 border-slate-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <span className="inline-block bg-slate-950 text-neon-yellow font-black uppercase tracking-widest text-[10px] px-3 py-1 border-2 border-slate-950 shadow-hard-md mb-4">
          EMPRESAS
        </span>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950 mb-4">
          GERENCIAR EMPRESAS
        </h1>
        <p className="text-xs font-mono font-bold text-slate-400 mb-12">
          Adicione empresas à sua lista para marcar vagas como &quot;Na sua lista&quot;.
          Uma empresa por linha.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Input */}
          <div>
            <div className="p-6 border-4 border-slate-950 bg-white shadow-hard-lg">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-4 block">
                LISTA DE EMPRESAS ({companies.length})
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="w-full h-64 border-2 border-slate-950 p-3 font-mono text-xs resize-none"
                placeholder="Ambev&#10;BRQ&#10;Nubank&#10;..."
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 w-full bg-slate-950 text-neon-yellow py-4 font-black uppercase tracking-widest text-xs hover:bg-neon-yellow hover:text-slate-950 transition-colors border-4 border-slate-950 shadow-hard-sm disabled:opacity-50"
              >
                {saving ? 'SALVANDO...' : 'SALVAR LISTA'}
              </button>
              {message && (
                <p className={`mt-2 text-xs font-mono font-bold ${message.includes('Erro') ? 'text-danger' : 'text-success'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Presence Table */}
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">
              PRESENÇA POR PLATAFORMA
            </h2>
            {presence.length === 0 ? (
              <div className="p-8 border-4 border-dashed border-slate-950 text-center">
                <p className="font-black uppercase text-slate-400">NENHUMA EMPRESA NA LISTA</p>
                <p className="text-xs font-mono text-slate-400 mt-2">
                  Adicione empresas e execute o pipeline
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border-4 border-slate-950 shadow-hard-md">
                <table className="w-full border-collapse text-xs font-mono font-bold">
                  <thead>
                    <tr className="bg-slate-950 text-neon-yellow">
                      <th className="text-left p-3 border-r-2 border-slate-800">EMPRESA</th>
                      <th className="text-center p-3 border-r-2 border-slate-800">GUPY</th>
                      <th className="text-center p-3 border-r-2 border-slate-800">INHIRE</th>
                      <th className="text-center p-3">VAGAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presence.map(p => (
                      <tr key={p.empresa} className="border-t-2 border-slate-950 hover:bg-slate-100 transition-colors">
                        <td className="p-3 border-r-2 border-slate-200">{p.empresa}</td>
                        <td className="p-3 border-r-2 border-slate-200 text-center">
                          {p.tem_gupy === 'Sim' ? (
                            <a href={p.pagina_gupy} target="_blank" rel="noopener noreferrer"
                              className="bg-neon-yellow text-slate-950 px-2 py-1 text-[9px] font-black border-2 border-slate-950 shadow-hard-sm">
                              SIM
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 border-r-2 border-slate-200 text-center">
                          {p.tem_inhire === 'Sim' ? (
                            <a href={p.pagina_inhire} target="_blank" rel="noopener noreferrer"
                              className="bg-slate-950 text-neon-yellow px-2 py-1 text-[9px] font-black border-2 border-slate-950 shadow-hard-sm">
                              SIM
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-black">{p.total_vagas_inhire || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
