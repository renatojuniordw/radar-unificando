'use client';

import { useState } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Heart, Copy, Check, QrCode } from 'lucide-react';

// TODO: substituir pelo brcode EMV real ("copia e cola") gerado no app do banco
// e gerar public/pix-qr.png a partir dele (ex: npx qrcode -o public/pix-qr.png -w 512 "<brcode>")
const PIX_BRCODE = '00020126TODO-substituir-pelo-brcode-real-do-banco';
const PIX_KEY = 'chave-pix-aleatoria@exemplo.com'; // TODO: chave PIX real (aleatória recomendada)
const COSTS_URL = 'https://github.com/renatobezerra/radar-unificando/blob/main/COSTS.md';

export default function DoarPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_BRCODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#020617', color: '#ffffff', minHeight: '100vh', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            component="h1"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: '#ccff00',
              color: '#020617',
              px: 2,
              py: 0.75,
              fontWeight: 900,
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: '2px solid #020617',
              boxShadow: '4px 4px 0px #ffffff',
              mb: 3,
            }}
          >
            <Heart size={14} />
            APOIE O RADAR UNIFICANDO
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2rem', sm: '3rem' },
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              mb: 2,
              color: '#ffffff',
            }}
          >
            MANTENHA A BUSCA <br /> DE VAGAS NO AR
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 560, mx: 'auto' }}>
            O Radar é gratuito e open source, mas tem custos reais: VPS, banco e
            tokens de IA no chat. Qualquer valor ajuda a manter tudo no ar.
          </Typography>
        </Box>

        {/* PIX */}
        <Box
          sx={{
            border: '2px solid #ccff00',
            boxShadow: '6px 6px 0px #ccff00',
            bgcolor: '#0f172a',
            p: { xs: 3, md: 4 },
            mb: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            sx={{ fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', mb: 2, color: '#ccff00' }}
          >
            <QrCode size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            PIX (Brasil — sem taxa)
          </Typography>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pix-qr.png"
            alt="QR code PIX para doação"
            width={220}
            height={220}
            style={{ imageRendering: 'pixelated', border: '2px solid #020617', boxShadow: '4px 4px 0px #ffffff' }}
          />
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2 }}>
            Chave PIX: <strong style={{ color: '#ffffff' }}>{PIX_KEY}</strong>
          </Typography>
          <Button
            variant="contained"
            onClick={handleCopy}
            startIcon={copied ? <Check size={16} /> : <Copy size={16} />}
            sx={{
              mt: 2,
              bgcolor: copied ? '#16a34a' : '#ccff00',
              color: '#020617',
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              '&:hover': { bgcolor: copied ? '#15803d' : '#b8e600' },
            }}
          >
            {copied ? 'Código copiado!' : 'Copiar código PIX'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mt: 5 }}>
          Custos transparentes? Veja o{' '}
          <a href={COSTS_URL} style={{ color: '#ccff00' }} rel="noopener noreferrer" target="_blank">
            COSTS.md
          </a>
          .
        </Typography>
      </Container>
    </Box>
  );
}
