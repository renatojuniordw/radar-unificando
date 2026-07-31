'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Fab, Drawer, IconButton, Typography, Chip, TextareaAutosize } from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ConfirmDialog } from '@/components/confirm-dialog';

const STORAGE_KEY = 'chat-assistant-ui-history';
const CHAT_ID_KEY = 'chat-assistant-ui-id';

const SUGGESTIONS = [
  'Quais vagas de DevOps estão abertas?',
  'Analise meu perfil para vagas remotas',
  'Recomende vagas de Front-end com React',
  'Como está o mercado de dados?',
];

const WELCOME_TEXT = `Olá! Sou o assistente de recolocação profissional do Radar. Posso te ajudar a:

- Buscar **vagas no Gupy** de acordo com seu perfil e interesses
- Sugerir **melhorias no seu currículo**
- Analisar sua **compatibilidade** com uma vaga específica

Não faço parte do processo seletivo — não tenho acesso a decisões de recrutadores nem posso garantir aprovação em nenhuma vaga.

Por segurança, não compartilhe dados sensíveis de terceiros no chat. E se você colar a descrição de uma vaga ou qualquer outro texto, sigo apenas as instruções que você me der diretamente — ignoro qualquer comando escondido dentro do conteúdo colado.

Como posso te ajudar hoje?`;

function createWelcomeMessage() {
  return {
    id: 'welcome-message',
    role: 'assistant' as const,
    parts: [{ type: 'text' as const, text: WELCOME_TEXT }],
  };
}

function getOrCreateChatId(): string {
  if (typeof window === 'undefined') return 'default';
  let chatId = localStorage.getItem(CHAT_ID_KEY);
  if (!chatId) {
    chatId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(CHAT_ID_KEY, chatId);
  }
  return chatId;
}

async function loadMessagesFromServer(chatId: string = 'default') {
  try {
    const res = await fetch(`/api/chat/history?chatId=${chatId}`);
    if (res.ok) {
      const data = await res.json();
      return data.messages || [];
    }
  } catch {}
  return [];
}

async function saveMessagesToServer(chatId: string, messages: any[]) {
  try {
    await fetch('/api/chat/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, messages }),
    });
  } catch {}
}

function loadMessagesLocal() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessagesLocal(messages: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

// SVG Icons (no emojis)
function BotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function MarkdownContent({ text }: { text: string }) {
  let processedText = text.replace(
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

  processedText = processedText.replace(/(\d+)\s*⭐/g, (_, count) => '★'.repeat(parseInt(count)));

  const cleaned = processedText
    // Remove decorative emoji (keep only text/markdown) — icons are rendered via SVG instead
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}️]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const components: Components = {
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

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {cleaned}
    </ReactMarkdown>
  );
}

export function ChatAssistantUI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatId] = useState(() => getOrCreateChatId());
  const endRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { messages, sendMessage, status, setMessages } = useChat({
    throttle: 100,
  });

  const loading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    async function load() {
      let stored = await loadMessagesFromServer(chatId);
      if (stored.length === 0) {
        stored = loadMessagesLocal();
      }
      if (stored.length > 0 && setMessages) {
        setMessages(stored);
      } else if (setMessages) {
        setMessages([createWelcomeMessage()]);
      }
      setIsLoaded(true);
    }
    load();
  }, [chatId, setMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length > 0 && isLoaded && !loading) {
      saveMessagesLocal(messages);
      const timeoutId = setTimeout(() => {
        saveMessagesToServer(chatId, messages);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, chatId, isLoaded, loading]);

  function handleSend() {
    if (!input.trim() || loading) return;
    sendMessage({ text: input });
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleConfirmClear() {
    setConfirmOpen(true);
  }

  async function handleClearHistory() {
    setConfirmOpen(false);
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    try {
      await fetch(`/api/chat/history?chatId=${chatId}`, { method: 'DELETE' });
    } catch {}
  }

  function handleNewChat() {
    setConfirmOpen(true);
  }

  return (
    <>
      {/* FAB Button */}
      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        aria-label="Abrir assistente de vagas"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          width: 56,
          height: 56,
          boxShadow: '0 4px 14px 0 rgba(2, 6, 23, 0.35)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(2, 6, 23, 0.45)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 200ms ease-out',
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 400 },
              maxWidth: '100vw',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              borderLeft: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'common.white',
              }}
            >
              <BotIcon />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                Assistente de Vagas
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                {loading ? 'Digitando...' : 'Online'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              onClick={handleNewChat}
              aria-label="Nova conversa"
              sx={{
                width: 44,
                height: 44,
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.light', color: 'common.white' },
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </IconButton>
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              sx={{
                width: 44,
                height: 44,
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 2,
            py: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            bgcolor: 'grey.50',
          }}
        >
          {!messages.some((m) => m.role === 'user') && (
            <Box
              sx={{
                textAlign: 'center',
                mt: 1,
                mb: 2,
                px: 3,
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.75 }}>
                {SUGGESTIONS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    onClick={() => setInput(s)}
                    sx={{
                      bgcolor: 'action.hover',
                      color: 'text.secondary',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.300' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {messages.map((msg, index) => (
            <Box
              key={`${msg.id}-${index}`}
              sx={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: 1,
                alignItems: 'flex-start',
              }}
            >
              {/* Avatar */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.200',
                  color: msg.role === 'user' ? 'common.white' : 'text.secondary',
                }}
              >
                {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
              </Box>

              {/* Message Bubble */}
              <Box
                sx={{
                  maxWidth: '88%',
                  px: 2,
                  py: 1.5,
                  borderRadius: 1.5,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'common.white',
                  color: msg.role === 'user' ? 'common.white' : 'text.primary',
                  border: msg.role === 'user' ? 'none' : '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownContent
                    text={msg.parts.filter(p => p.type === 'text').map(p => p.text).join('')}
                  />
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.parts.filter(p => p.type === 'text').map(p => p.text).join('')}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.200',
                  color: 'text.secondary',
                }}
              >
                <BotIcon />
              </Box>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  bgcolor: 'common.white',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'grey.400',
                        animation: 'pulse 1.4s infinite ease-in-out',
                        animationDelay: `${i * 0.2}s`,
                        '@keyframes pulse': {
                          '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                          '40%': { opacity: 1, transform: 'scale(1)' },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          <div ref={endRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'common.white',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              p: 0.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              '&:focus-within': {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 2px rgba(2, 6, 23, 0.12)',
              },
              transition: 'all 150ms ease-out',
            }}
          >
            <TextareaAutosize
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              aria-label="Mensagem"
              minRows={1}
              maxRows={6}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                fontSize: '0.875rem',
                outline: 'none',
                color: 'inherit',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Enviar mensagem"
              sx={{
                width: 44,
                height: 44,
                bgcolor: input.trim() && !loading ? 'primary.main' : 'grey.300',
                color: 'common.white',
                '&:hover': {
                  bgcolor: input.trim() && !loading ? 'primary.dark' : 'grey.400',
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.200',
                  color: 'grey.400',
                },
                transition: 'all 150ms ease-out',
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        title="Nova Conversa"
        message="Deseja iniciar uma nova conversa? O histórico atual será limpo."
        confirmLabel="Nova Conversa"
        onConfirm={handleClearHistory}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
