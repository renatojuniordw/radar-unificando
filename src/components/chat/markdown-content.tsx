'use client';

import { memo, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import type { Components } from 'react-markdown';
import { ExternalLinkIcon } from './icons';
import { parseJobCards } from './job-card-parser';
import { JobCard } from './job-card';
import { CourseCard } from './course-card';

function tablesToCards(text: string): string {
  return text.replace(
    /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g,
    (match, header, rows) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rowsArray = rows.trim().split('\n').map((row: string) => {
        return row.split('|').map((cell: string) => cell.trim()).filter(Boolean);
      });

      let card = '\n';
      rowsArray.forEach((row: string[]) => {
        card += row.map((cell: string, i: number) => {
          const headerLabel = headers[i] || '';
          return headerLabel ? `**${headerLabel}:** ${cell}` : cell;
        }).join('\n') + '\n\n---\n\n';
      });

      return card;
    }
  );
}

function normalizeText(text: string): string {
  return tablesToCards(text)
    .replace(/(\d+)\s*⭐/g, (_, count) => '★'.repeat(parseInt(count)))
    // Remove decorative emoji (keep only text/markdown) — icons are rendered via SVG instead
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}️]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

const markdownComponents: Components = {
  a: ({ href, children }) => {
    const isJobLink = href && (href.includes('gupy.io') || href.includes('job'));
    const linkText = String(children).trim();

    let buttonText = 'Visualizar';
    if (linkText.includes('candidat') || linkText.includes('Candidat')) {
      buttonText = 'Candidatar-se';
    } else if (linkText.includes('vaga') || linkText.includes('Vaga')) {
      buttonText = 'Ver Vaga';
    }

    return (
      <Box
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 2,
          py: 1,
          my: 1,
          minHeight: 36,
          borderRadius: 1.5,
          bgcolor: isJobLink ? 'primary.main' : 'transparent',
          color: isJobLink ? 'common.white' : 'primary.main',
          fontSize: '0.8125rem',
          fontWeight: 600,
          textDecoration: 'none',
          border: isJobLink ? 'none' : '1px solid',
          borderColor: 'primary.main',
          cursor: 'pointer',
          transition: 'all 150ms ease-out',
          '&:hover': {
            bgcolor: isJobLink ? 'primary.dark' : 'action.hover',
            transform: 'translateY(-1px)',
          },
        }}
      >
        {isJobLink ? buttonText : linkText}
        <ExternalLinkIcon />
      </Box>
    );
  },
  h2: ({ children }) => (
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3, mb: 1.5, color: 'primary.main', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="body1" sx={{ fontWeight: 600, mt: 2, mb: 1, color: 'text.primary' }}>
      {children}
    </Typography>
  ),
  p: ({ children }) => (
    <Typography variant="body2" component="div" sx={{ mb: 1.5, lineHeight: 1.7, color: 'text.secondary', '&:last-child': { mb: 0 } }}>
      {children}
    </Typography>
  ),
  ul: ({ children }) => (
    <Box component="ul" sx={{ pl: 2.5, mb: 1.5, '& li': { mb: 0.5, lineHeight: 1.6, color: 'text.secondary' } }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{ pl: 2.5, mb: 1.5, '& li': { mb: 0.5, lineHeight: 1.6, color: 'text.secondary' } }}>
      {children}
    </Box>
  ),
  strong: ({ children }) => (
    <Box component="strong" sx={{ color: 'text.primary', fontWeight: 700 }}>
      {children}
    </Box>
  ),
  hr: () => (
    <Box component="hr" sx={{ border: 'none', borderTop: '1px solid', borderColor: 'divider', my: 2.5 }} />
  ),
};

export const MarkdownContent = memo(function MarkdownContent({ text }: { text: string }) {
  const segments = useMemo(() => parseJobCards(tablesToCards(text)), [text]);

  return (
    <>
      {segments.map((segment, index) =>
        segment.type === 'job' ? (
          <JobCard key={index} job={segment.job} />
        ) : segment.type === 'course' ? (
          <CourseCard key={index} course={segment.course} />
        ) : (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={markdownComponents}
          >
            {normalizeText(segment.text)}
          </ReactMarkdown>
        ),
      )}
    </>
  );
});
