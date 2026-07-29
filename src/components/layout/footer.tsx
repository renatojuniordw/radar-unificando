import { Box, Container, Typography, Link } from '@mui/material';

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#020617',
        borderTop: '4px solid #ccff00',
        py: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Typography
          variant="caption"
          align="center"
          display="block"
          color="grey.500"
          sx={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: 9 }}
        >
          RADAR UNIFICANDO — BUSCA AUTOMÁTICA DE VAGAS GUPY + INHIRE
        </Typography>
        <Typography
          variant="caption"
          align="center"
          display="block"
          color="grey.500"
          sx={{ mt: 1, fontWeight: 700, letterSpacing: '0.05em', fontSize: 9 }}
        >
          PROJETO ORIGINAL{' '}
          <Link href="https://github.com/anomalyco/busca-vagas-gupy-inhire" color="warning.main" target="_blank">
            BUSCA-VAGAS-GUPY-INHIRE
          </Link>
          {' · '}REESCRITO PARA WEB POR{' '}
          <Link href="https://renatobezerra.com.br/" color="warning.main" target="_blank">
            RENATO BEZERRA
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}
