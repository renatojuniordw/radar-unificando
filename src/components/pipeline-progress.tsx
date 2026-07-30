'use client';

import { useRef, useEffect } from 'react';

interface LogEntry {
  type: string;
  step?: string;
  message?: string;
  error?: string;
}

interface Props {
  logs: LogEntry[];
  running: boolean;
  expanded: boolean;
  onToggle: () => void;
}

const STEP_LABELS: Record<string, string> = {
  step_start: '▶ Iniciando',
  step_progress: '⏳ Processando',
  step_complete: '✓ Concluído',
  step_warn: '⚠ Atenção',
  step_error: '✕ Erro',
  pipeline_complete: '✓ FINALIZADO',
  pipeline_error: '✕ ERRO',
  pipeline_cancelled: '⚠ CANCELADO',
};

function getStepColor(type: string) {
  switch (type) {
    case 'step_start': return { bg: '#ccff00', text: '#020617' };
    case 'step_progress': return { bg: '#94a3b8', text: '#020617' };
    case 'step_complete': return { bg: '#16a34a', text: '#ffffff' };
    case 'step_warn': return { bg: '#ffaa00', text: '#020617' };
    case 'step_error': return { bg: '#dc2626', text: '#ffffff' };
    case 'pipeline_complete': return { bg: '#16a34a', text: '#ffffff' };
    case 'pipeline_error': return { bg: '#dc2626', text: '#ffffff' };
    case 'pipeline_cancelled': return { bg: '#ffaa00', text: '#020617' };
    default: return { bg: '#475569', text: '#ffffff' };
  }
}

export function PipelineProgress({ logs, running, expanded, onToggle }: Props) {
  const logEndRef = useRef<HTMLDivElement>(null);

  const completedSteps = logs.filter(l => l.type === 'step_complete').length;
  const totalSteps = logs.filter(l => l.type === 'step_start').length;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <details
      open={expanded}
      onToggle={(e) => onToggle()}
      className="faq-item"
      style={{ marginBottom: 24 }}
    >
      <summary style={{ fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.05em' }}>
        <span>
          {running ? 'BUSCANDO VAGAS...' : logs.length > 0 ? 'RESULTADO DA BUSCA' : 'PROGRESSO'}
          {running && (
            <>
              <span style={{ display: 'inline-block', width: 120, height: 4, background: '#334155', margin: '0 8px', verticalAlign: 'middle', position: 'relative', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', background: '#ccff00', animation: 'pulse-glow 1s infinite', width: '60%' }} />
              </span>
              {totalSteps > 0 && (
                <span style={{ color: '#64748b', marginLeft: 4 }}>{completedSteps}/{totalSteps}</span>
              )}
            </>
          )}
          {!running && logs.length > 0 && (
            <span style={{
              display: 'inline-block',
              background: '#16a34a',
              color: '#fff',
              fontSize: '0.5rem',
              fontWeight: 900,
              padding: '1px 6px',
              marginLeft: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'ui-monospace, monospace',
              verticalAlign: 'middle',
            }}>
              {logs.filter(l => l.type === 'pipeline_complete').length > 0 ? 'Concluído' : 'Finalizado'}
            </span>
          )}
        </span>
        <span className="faq-arrow">↓</span>
      </summary>
      <div className="faq-content" style={{ padding: '0 20px 16px' }}>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.7rem',
            maxHeight: 300,
            overflow: 'auto',
            backgroundColor: '#020617',
            color: '#e2e8f0',
            padding: 16,
            border: '2px solid #334155',
          }}
        >
          {logs.length === 0 && !running && (
            <span style={{ color: '#64748b', fontSize: '0.65rem' }}>
              Nenhuma busca em andamento. Preencha os campos acima e clique em EXECUTAR BUSCA.
            </span>
          )}
          {logs.map((log, i) => {
            const colors = getStepColor(log.type);
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                <span
                  style={{
                    padding: '1px 6px',
                    backgroundColor: colors.bg,
                    color: colors.text,
                    fontWeight: 700,
                    fontSize: '0.55rem',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2rem',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  {STEP_LABELS[log.type] || log.type}
                </span>
                <span style={{ fontSize: '0.65rem' }}>{log.message}</span>
              </div>
            );
          })}
          {running && (
            <span style={{ color: '#475569', display: 'block', marginTop: 8, fontSize: '0.65rem' }}>
              Processando...
            </span>
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </details>
  );
}
