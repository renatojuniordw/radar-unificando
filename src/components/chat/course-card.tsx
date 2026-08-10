'use client';

import { memo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import type { ParsedCourse } from './job-card-parser';
import { ExternalLinkIcon } from './icons';
import { trackCourseClick } from '@/lib/utils/course-analytics';

interface Props {
  course: ParsedCourse;
}

function CourseCardComponent({ course }: Props) {
  const provider = course.provider?.toUpperCase();

  const handleClick = () => {
    if (course.link) {
      trackCourseClick({
        courseId: course.link,
        skill: course.skill,
        platform: course.provider,
        origin: 'chat',
        url: course.link,
      });
    }
  };

  const metaItems = [
    course.skill ? `Skill: ${course.skill}` : undefined,
    course.price,
  ].filter((item): item is string => Boolean(item));

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
          {provider && (
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: provider === 'ALURA' ? 'success.main' : 'primary.main',
              }}
            >
              {provider}
            </Typography>
          )}
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
            {course.title}
          </Typography>
        </Box>
        {course.link && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            component="a"
            href={course.link}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<ExternalLinkIcon />}
            onClick={handleClick}
            sx={{ flexShrink: 0, textTransform: 'none' }}
          >
            Ver Curso
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
    </Box>
  );
}

export const CourseCard = memo(CourseCardComponent);