'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box, Fab, Drawer, TextField, IconButton, Typography, Paper, Avatar, CircularProgress, Chip,
} from '@mui/material';
import { Chat as ChatIcon, Send as SendIcon, Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import { useChatAssistant } from '@/contexts/chat-assistant-context';

const TOOL_LABELS: Record<string, string> = {
  search_jobs: 'Buscando vagas...',
  get_my_profile: 'Consultando seu perfil...',
  get_job_details: 'Buscando detalhes da vaga...',
  analyze_job_fit: 'Analisando compatibilidade...',
};

function MarkdownBubble({ text }: { text: string }) {
  return (
    <Box
      sx={{
        fontSize: '0.875rem',
        lineHeight: 1.43,
        '& > :first-of-type': { mt: 0 },
        '& > :last-child': { mb: 0 },
        '& p': { m: 0, mb: 1 },
        '& ul, & ol': { m: 0, mb: 1, pl: 2.5 },
        '& li': { mb: 0.25 },
        '& strong': { fontWeight: 700 },
        '& code': {
          bgcolor: 'action.hover',
          borderRadius: 0.5,
          px: 0.5,
          fontSize: '0.8em',
        },
        '& a': { color: 'primary.main' },
      }}
    >
      <ReactMarkdown>{text}</ReactMarkdown>
    </Box>
  );
}

export function ChatAssistant() {
  const { open, pendingPrompt, close, clearPendingPrompt } = useChatAssistant();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({ throttle: 100 });
  const loading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && pendingPrompt) {
      setInput(pendingPrompt);
      clearPendingPrompt();
    }
  }, [open, pendingPrompt, clearPendingPrompt]);

  function handleSend(text?: string) {
    const msg = text ?? input;
    if (!msg.trim() || loading) return;
    sendMessage({ text: msg });
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
      >
        <ChatIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{
          paper: { sx: { width: 380, maxWidth: '100vw', display: 'flex', flexDirection: 'column' } },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Assistente de Vagas</Typography>
          <IconButton size="small" onClick={close}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              Pergunte sobre vagas, peça recomendações ou analise seu perfil.
              <br /><br />
              Ex: "Busque vagas de Data Analyst remotas"
            </Typography>
          )}

          {messages.map(msg => {
            // Agrupa as partes em "blocos": cada step-start ou chamada de ferramenta
            // inicia um novo bloco, para renderizar como bolhas separadas.
            const blocks: Array<
              | { kind: 'text'; key: string; text: string }
              | { kind: 'tool'; key: string; toolName: string }
            > = [];

            msg.parts.forEach((part, pi) => {
              if (part.type === 'text') {
                if (!part.text.trim()) return;
                blocks.push({ kind: 'text', key: `${msg.id}-text-${pi}`, text: part.text });
              } else if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
                const toolName = part.type === 'dynamic-tool' ? (part as any).toolName : part.type.slice('tool-'.length);
                const toolCallId = (part as any).toolCallId || pi;
                blocks.push({ kind: 'tool', key: `${msg.id}-tool-${toolCallId}`, toolName });
              }
            });

            return blocks.map(block => (
              <Box
                key={block.key}
                sx={{ display: 'flex', gap: 1, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
              >
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.500' }}>
                  {msg.role === 'user' ? 'U' : 'A'}
                </Avatar>

                {block.kind === 'tool' ? (
                  <Chip
                    size="small"
                    icon={<SearchIcon fontSize="small" />}
                    label={TOOL_LABELS[block.toolName] || `Usando ${block.toolName}...`}
                    sx={{ alignSelf: 'center' }}
                  />
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      maxWidth: '80%',
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                      color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownBubble text={block.text} />
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {block.text}
                      </Typography>
                    )}
                  </Paper>
                )}
              </Box>
            ));
          })}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', pl: 4 }}>
              <CircularProgress size={16} />
            </Box>
          )}

          {error && (
            <Typography variant="body2" color="error" sx={{ pl: 4 }}>
              {error.message || 'Erro ao processar a mensagem. Tente novamente.'}
            </Typography>
          )}

          <div ref={endRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton size="small" onClick={() => handleSend()} disabled={!input.trim() || loading}>
                    <SendIcon fontSize="small" />
                  </IconButton>
                ),
              },
            }}
          />
        </Box>
      </Drawer>
    </>
  );
}
