import { Box, Typography } from '@mui/material';

// Deep-link estático de afiliado da Impact (formato trk.udemy.com/c/{account}/{campaign}/{ad}).
// O script da Impact (impactStat) em layout.tsx faz o tracking de clique/impressão
// automaticamente; buildAffiliateUrl não o altera (só modifica URLs udemy.com).
const FALLBACK_URL = 'https://trk.udemy.com/c/7591577/3193860/39854';

export function CourseFallbackCta() {
  return (
    <Box
      className="card-dark"
      sx={{
        mt: 6,
        p: { xs: 2.5, sm: 3.5 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ maxWidth: 560 }}>
        <Typography
          sx={{
            fontWeight: 900,
            color: '#ffffff',
            fontSize: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            mb: 0.5,
          }}
        >
          Não encontrou o curso desejado?
        </Typography>
        <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.55 }}>
          Procure através de nosso link para apoiar o projeto — sem custo
          adicional para você.
        </Typography>
      </Box>
      <Box
        component="a"
        href={FALLBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-neon"
        sx={{ fontSize: '0.7rem', px: 2, py: 1.25, textDecoration: 'none', flexShrink: 0 }}
      >
        PROCURAR NA UDEMY →
      </Box>
    </Box>
  );
}
