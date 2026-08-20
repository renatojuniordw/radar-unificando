import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import {
  DICA_CATEGORIES,
  type Dica,
  type DicaCategory,
} from '@/lib/core/dicas/dica-catalog';

interface Props {
  dica: Dica;
}

function CategoryBadge({ category }: { category: DicaCategory }) {
  return (
    <Box
      sx={{
        display: 'inline-block',
        bgcolor: '#020617',
        color: '#ccff00',
        fontWeight: 900,
        fontSize: '0.6rem',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        fontFamily: 'ui-monospace, monospace',
        px: 1,
        py: 0.5,
        border: '2px solid #ccff00',
        boxShadow: '2px 2px 0px #ccff00',
      }}
    >
      {DICA_CATEGORIES[category]?.label ?? category}
    </Box>
  );
}

export function DicaCard({ dica }: Props) {
  return (
    <Box
      className="card-dark"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 2.5,
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        <CategoryBadge category={dica.category} />
        <Typography
          sx={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.7rem',
            color: '#94a3b8',
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          {dica.estimatedReadingMinutes} min
        </Typography>
      </Box>
      <Typography
        sx={{
          fontWeight: 900,
          color: '#ffffff',
          fontSize: '1.05rem',
          lineHeight: 1.2,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
        }}
      >
        {dica.shortTitle}
      </Typography>
      <Typography
        sx={{
          color: '#cbd5e1',
          fontSize: '0.85rem',
          lineHeight: 1.55,
          flexGrow: 1,
        }}
      >
        {dica.description}
      </Typography>
      <Link
        href={`/dicas/${dica.slug}`}
        style={{ textDecoration: 'none', marginTop: 'auto' }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40px',
            bgcolor: '#ccff00',
            color: '#020617',
            px: 2,
            fontWeight: 900,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            fontFamily: 'ui-monospace, monospace',
            boxShadow: '3px 3px 0px #000',
            mt: 1,
          }}
        >
          LER DICAS →
        </Box>
      </Link>
    </Box>
  );
}
