'use client';

import { Box, Chip } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface Props {
  lastMessageText: string;
  loading: boolean;
  onSelect: (prompt: string) => void;
}

export function getDynamicSuggestions(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes('🏢') || lower.includes('vaga') || lower.includes('oportunidade')) {
    return [
      {
        label: 'Analisar Fit',
        prompt: 'Analise minha compatibilidade com a primeira vaga listada acima.',
        icon: <AssessmentIcon fontSize="small" />,
      },
      {
        label: 'Gerar Carta',
        prompt: 'Gere uma carta de apresentação para a primeira vaga.',
        icon: <DescriptionIcon fontSize="small" />,
      },
      {
        label: 'Ver Mais Vagas',
        prompt: 'Busque mais 3 vagas parecidas no Gupy.',
        icon: <SearchIcon fontSize="small" />,
      },
    ];
  }

  if (lower.includes('entrevista') || lower.includes('roteiro') || lower.includes('pergunta')) {
    return [
      {
        label: 'Simular Entrevista',
        prompt: 'Vamos simular essa entrevista! Faça a primeira pergunta.',
        icon: <RecordVoiceOverIcon fontSize="small" />,
      },
      {
        label: 'Analisar Fit',
        prompt: 'Analise minha compatibilidade com a vaga dessa entrevista.',
        icon: <AssessmentIcon fontSize="small" />,
      },
    ];
  }

  return [
    {
      label: 'Analisar Currículo',
      prompt: 'Analise meu perfil cadastrado e sugira melhorias no currículo.',
      icon: <DescriptionIcon fontSize="small" />,
    },
    {
      label: 'Buscar Vagas',
      prompt: 'Busque vagas de tecnologia alinhadas ao meu perfil no Gupy.',
      icon: <SearchIcon fontSize="small" />,
    },
    {
      label: 'Panorama do Mercado',
      prompt: 'Como está o mercado de tecnologia para o meu perfil hoje?',
      icon: <TrendingUpIcon fontSize="small" />,
    },
  ];
}

export function ChatSuggestedReplies({ lastMessageText, loading, onSelect }: Props) {
  if (loading || !lastMessageText) return null;

  const suggestions = getDynamicSuggestions(lastMessageText);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      {suggestions.map((item, i) => (
        <Chip
          key={i}
          icon={item.icon}
          label={item.label}
          onClick={() => onSelect(item.prompt)}
          size="small"
          variant="outlined"
          color="primary"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            py: 1.5,
            px: 0.5,
            bgcolor: 'grey.50',
            borderColor: 'primary.light',
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'common.white',
              borderColor: 'primary.main',
              transform: 'translateY(-1px)',
              '& .MuiChip-icon': {
                color: 'common.white',
              },
            },
          }}
        />
      ))}
    </Box>
  );
}
