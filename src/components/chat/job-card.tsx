'use client';

import { memo, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import type { ParsedJob } from './job-card-parser';
import { ExternalLinkIcon } from './icons';

interface Props {
  job: ParsedJob;
}

function JobCardComponent({ job }: Props) {
  const [expanded, setExpanded] = useState(false);

  const metaItems = [
    job.location,
    job.modality,
    job.date ? `Publicada em ${job.date}` : undefined,
  ].filter((item): item is string => Boolean(item));

  const hasDescription = Boolean(job.description);

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
    </Box>
  );
}

export const JobCard = memo(JobCardComponent);