'use client';

import { type RefObject } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { JobMobileCard } from './job-mobile-card';
import type { Job } from '@/lib/types/job';

const ITEMS_PER_PAGE = 10;

interface Props {
  jobs: Job[];
  containerRef: RefObject<HTMLDivElement | null>;
  page: number;
  onPageChange: (page: number) => void;
  canGenerateResume: boolean;
  onGenerateResume: (job: Job) => void;
  generatingJobKey: string | null;
  onAnalyzeAts: (job: Job) => void;
}

export function JobMobileList({ jobs, containerRef, page, onPageChange, canGenerateResume, onGenerateResume, generatingJobKey, onAnalyzeAts }: Props) {
  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);

  function goToPage(newPage: number) {
    onPageChange(newPage);
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Box ref={containerRef} sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
      {jobs
        .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
        .map((job, index) => (
          <JobMobileCard
            key={job.id || `${job.company}-${job.title}-${index}`}
            job={job}
            canGenerateResume={canGenerateResume}
            onGenerateResume={onGenerateResume}
            generatingJobKey={generatingJobKey}
            onAnalyzeAts={onAnalyzeAts}
          />
        ))}

      {/* Mobile Pagination Navigation Bar */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            pt: 1,
            pb: 1,
            gap: 1,
            borderTop: '2px dashed #cbd5e1',
            mt: 1,
          }}
        >
          <Button
            disabled={page === 1}
            onClick={() => goToPage(Math.max(page - 1, 1))}
            size="small"
            sx={{
              border: '2px solid #020617',
              bgcolor: page === 1 ? '#e2e8f0' : '#ffffff',
              color: '#020617',
              fontWeight: 900,
              fontSize: '0.75rem',
              fontFamily: 'ui-monospace, monospace',
              borderRadius: 0,
              boxShadow: page === 1 ? 'none' : '2px 2px 0px #000',
              px: 1.5,
              py: 0.75,
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            ← ANTERIOR
          </Button>

          <Typography
            sx={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.75rem',
              fontWeight: 900,
              color: '#020617',
            }}
          >
            PÁG {page} / {totalPages}
          </Typography>

          <Button
            disabled={page >= totalPages}
            onClick={() => goToPage(Math.min(page + 1, totalPages))}
            size="small"
            sx={{
              border: '2px solid #020617',
              bgcolor: page >= totalPages ? '#e2e8f0' : '#020617',
              color: page >= totalPages ? '#94a3b8' : '#ccff00',
              fontWeight: 900,
              fontSize: '0.75rem',
              fontFamily: 'ui-monospace, monospace',
              borderRadius: 0,
              boxShadow: page >= totalPages ? 'none' : '2px 2px 0px #000',
              px: 1.5,
              py: 0.75,
              opacity: page >= totalPages ? 0.5 : 1,
            }}
          >
            PRÓXIMA →
          </Button>
        </Box>
      )}
    </Box>
  );
}
