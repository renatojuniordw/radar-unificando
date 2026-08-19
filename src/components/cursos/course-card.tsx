'use client';

import { Box, Typography } from '@mui/material';
import type { Course } from '@/lib/core/courses/course-provider';
import { buildAffiliateUrl } from '@/lib/core/courses/course-provider';
import { trackCourseClick } from '@/lib/utils/course-analytics';

interface Props {
  course: Course;
  /** Variante compacta para a sidebar de recomendações */
  compact?: boolean;
  /** Origem do clique para analytics */
  origin?: 'cursos' | 'sidebar';
}

function ProviderBadge({ provider }: { provider: Course['provider'] }) {
  return (
    <Box
      sx={{
        display: 'inline-block',
        bgcolor: '#ccff00',
        color: '#020617',
        fontWeight: 900,
        fontSize: '0.6rem',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        px: 1,
        py: 0.5,
        border: '2px solid #020617',
        boxShadow: '2px 2px 0px #000',
        alignSelf: 'flex-start',
      }}
    >
      {'Udemy'}
    </Box>
  );
}

export function CourseCard({ course, compact = false, origin = 'cursos' }: Props) {
  const url = buildAffiliateUrl(course);

  const handleClick = () => {
    trackCourseClick({
      courseId: course.id,
      skill: course.skillTags[0],
      platform: course.provider,
      origin,
      url,
    });
  };

  return (
    <Box
      className="card-dark"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 1 : 1.5,
        p: compact ? 1.5 : 2.5,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <ProviderBadge provider={course.provider} />
        {course.rating && (
          <Typography
            sx={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.7rem',
              color: '#ccff00',
              fontWeight: 800,
            }}
          >
            ★ {course.rating}
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          fontWeight: 900,
          color: '#ffffff',
          fontSize: compact ? '0.9rem' : '1.05rem',
          lineHeight: 1.2,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
        }}
      >
        {course.title}
      </Typography>

      {!compact && (
        <Typography
          sx={{
            color: '#cbd5e1',
            fontSize: '0.85rem',
            lineHeight: 1.55,
            flexGrow: 1,
          }}
        >
          {course.description}
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          mt: 'auto',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            color: '#ccff00',
            fontWeight: 800,
          }}
        >
          {course.priceLabel}
        </Typography>
        <Box
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-neon"
          onClick={handleClick}
          sx={{
            fontSize: '0.65rem',
            px: 1.5,
            py: 0.75,
            textDecoration: 'none',
          }}
        >
          VER CURSO →
        </Box>
      </Box>
    </Box>
  );
}