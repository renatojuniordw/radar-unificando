'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import Link from 'next/link';

interface MatchResult {
  jobId: string;
  empresa: string;
  tituloVaga: string;
  plataforma: string;
  link: string;
  score: number;
  matchedSkills: string[];
  missingMandatory: string[];
  evidence: string[];
}

export default function MatchPage() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/match')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          setError(data.error || 'Erro ao carregar match');
        }
      })
      .catch(() => setError('Erro ao carregar match'))
      .finally(() => setLoading(false));
  }, []);

  function getScoreColor(score: number): string {
    if (score >= 70) return '#16a34a';
    if (score >= 40) return '#ffaa00';
    return '#dc2626';
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        MATCH DE VAGAS
      </Typography>
      <Typography sx={{ mb: 4, color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Compatibilidade do seu perfil com cada vaga encontrada.
      </Typography>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 60, border: '4px solid #e2e8f0', background: '#f1f5f9' }} />
          ))}
        </div>
      ) : error ? (
        <div className="card-brutalist" style={{ padding: 24 }}>
          <p style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', margin: '0 0 16px' }}>{error}</p>
          <Link href="/perfil" style={{
            backgroundColor: '#ccff00', color: '#020617', fontWeight: 900,
            padding: '10px 20px', textDecoration: 'none', textTransform: 'uppercase',
            fontSize: '0.7rem', letterSpacing: '0.05em', border: '4px solid #020617',
            boxShadow: '4px 4px 0px #000', fontFamily: 'ui-monospace, monospace',
            display: 'inline-block',
          }}>
            CRIAR PERFIL
          </Link>
        </div>
      ) : results.length === 0 ? (
        <div className="card-brutalist" style={{ padding: 24 }}>
          <p style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', margin: 0 }}>Nenhuma vaga para comparar. Execute o pipeline primeiro.</p>
        </div>
      ) : (
        <div className="card-brutalist" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#020617' }}>
                  {['EMPRESA', 'VAGA', 'PLAT', 'SCORE', 'SKILLS', 'AÇÃO'].map(h => (
                    <th key={h} style={{ color: '#ccff00', fontWeight: 700, textAlign: 'left', padding: '10px 12px', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.jobId} style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.empresa}</td>
                    <td style={{ padding: '10px 12px' }}>{r.tituloVaga}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ border: '2px solid #94a3b8', padding: '1px 6px', fontWeight: 700, fontSize: '0.55rem', textTransform: 'uppercase' }}>
                        {r.plataforma}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 900, color: getScoreColor(r.score), fontSize: '0.85rem' }}>{r.score}%</span>
                        <div style={{ width: 80, height: 8, background: '#e2e8f0', position: 'relative' }}>
                          <div style={{ width: `${r.score}%`, height: '100%', backgroundColor: getScoreColor(r.score) }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {r.matchedSkills.slice(0, 3).map(s => (
                          <span key={s} style={{ border: '2px solid #16a34a', color: '#16a34a', padding: '1px 6px', fontWeight: 700, fontSize: '0.5rem', textTransform: 'uppercase' }}>{s}</span>
                        ))}
                        {r.missingMandatory.slice(0, 2).map(s => (
                          <span key={s} style={{ border: '2px solid #dc2626', color: '#dc2626', padding: '1px 6px', fontWeight: 700, fontSize: '0.5rem', textTransform: 'uppercase' }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#020617', color: '#ccff00', fontWeight: 900,
                          fontSize: '0.55rem', padding: '4px 10px', textTransform: 'uppercase',
                          letterSpacing: '0.05em', textDecoration: 'none', border: '2px solid #020617',
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        CANDIDATAR
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  );
}
