'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box, Fab, Drawer, TextField, IconButton, Typography, Paper, Avatar, CircularProgress,
} from '@mui/material';
import { Chat as ChatIcon, Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao processar mensagem.' }]);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantMsg = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:"')) {
            const text = line.slice(3, -2);
            assistantMsg += text;
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: 'assistant', content: assistantMsg };
              return copy;
            });
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }]);
    }

    setLoading(false);
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
        onClick={() => setOpen(true)}
      >
        <ChatIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 380, maxWidth: '100vw', display: 'flex', flexDirection: 'column' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Assistente de Vagas</Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
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

          {messages.map((msg, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.500' }}>
                {msg.role === 'user' ? 'U' : 'A'}
              </Avatar>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  maxWidth: '80%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content || (i === messages.length - 1 && loading ? '' : msg.content)}
                </Typography>
              </Paper>
            </Box>
          ))}

          {loading && messages[messages.length - 1]?.content === '' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', pl: 4 }}>
              <CircularProgress size={16} />
            </Box>
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
                  <IconButton size="small" onClick={handleSend} disabled={!input.trim() || loading}>
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
