'use client';

import { memo, useState } from 'react';
import { Box, Typography, Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import type { ParsedJob } from './job-card-parser';
import { ExternalLinkIcon } from './icons';
import { AtsAnalysisDrawer } from '@/components/ats/ats-analysis-drawer';
import { downloadAdaptedResume } from '@/lib/client/resume-download';

interface Props {
  job: ParsedJob;
}

function JobCardComponent({ job }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [atsOpen, setAtsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const metaItems = [
    job.location,
    job.modality,
    job.date ? `Publicada em ${job.date}` : undefined,
  ].filter((item): item is string => Boolean(item));

  const hasDescription = Boolean(job.description);

  const handleGenerateResume = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await downloadAdaptedResume({
        title: job.title,
        company: job.company || '',
        description: job.description,
      });
      setSnackbar('Currículo adaptado baixado!');
    } catch (e) {
      setSnackbar(e instanceof Error ? e.message : 'Erro ao gerar o currículo.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.5,
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
            {job.title}
          </Typography>
          {job.company && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {job.company}
            </Typography>
          )}
        </Box>
        {job.link && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            component="a"
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<ExternalLinkIcon />}
            sx={{ flexShrink: 0, textTransform: 'none' }}
          >
            Ver Vaga
          </Button>
        )}
      </Box>

      {metaItems.length > 0 && (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
        >
          {metaItems.join(' · ')}
        </Typography>
      )}

      {hasDescription && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary' }}>
            Descrição
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              ...(expanded
                ? {}
                : {
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }),
            }}
          >
            {job.description}
          </Typography>
          <Typography
            component="button"
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            sx={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              p: 0,
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'underline',
              textTransform: 'none',
            }}
          >
            {expanded ? 'ver menos' : 'ver mais'}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setAtsOpen(true)}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Analisar ATS
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={handleGenerateResume}
          disabled={generating}
          startIcon={generating ? <CircularProgress size={14} /> : undefined}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {generating ? 'Gerando currículo...' : 'Gerar Currículo'}
        </Button>
      </Box>

      <AtsAnalysisDrawer
        open={atsOpen}
        job={{ title: job.title, company: job.company, description: job.description }}
        onClose={() => setAtsOpen(false)}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.includes('baixado') ? 'success' : 'error'}
          variant="filled"
          onClose={() => setSnackbar('')}
        >
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export const JobCard = memo(JobCardComponent);