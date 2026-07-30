'use client';

import { useRef, useEffect } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography, Box, LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

function getLogColor(type: string) {
  switch (type) {
    case 'step_start': return { color: '#ccff00' };
    case 'step_progress': return { color: '#94a3b8' };
    case 'step_complete': return { color: '#16a34a' };
    case 'step_warn': return { color: '#ffaa00' };
    case 'step_error': return { color: '#dc2626' };
    case 'pipeline_complete': return { color: '#16a34a', fontWeight: '700' };
    case 'pipeline_error': return { color: '#dc2626', fontWeight: '700' };
    case 'pipeline_cancelled': return { color: '#ffaa00', fontWeight: '700' };
    default: return {};
  }
}

export function PipelineProgress({ logs, running, expanded, onToggle }: Props) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <Accordion expanded={expanded} onChange={onToggle} sx={{ mb: 3 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          PROGRESSO {running && <LinearProgress sx={{ mt: 1, width: 200, display: 'inline-block', ml: 2 }} />}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            fontFamily: 'monospace', fontSize: '0.8rem', maxHeight: 300,
            overflow: 'auto', bgcolor: '#020617', color: '#e2e8f0',
            p: 2, borderRadius: 1,
          }}
        >
          {logs.length === 0 && !running && (
            <Typography variant="caption" color="grey.600">Aguardando execução...</Typography>
          )}
          {logs.map((log, i) => (
            <Box key={i} sx={getLogColor(log.type)}>
              <Typography variant="caption" component="span" sx={{ color: '#475569' }}>
                [{log.step || '-'}]
              </Typography>{' '}
              <Typography variant="caption" component="span">{log.message}</Typography>
            </Box>
          ))}
          {running && (
            <Typography variant="caption" sx={{ color: '#475569', animation: 'pulse 1s infinite' }}>
              Processando...
            </Typography>
          )}
          <div ref={logEndRef} />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
