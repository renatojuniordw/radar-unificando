'use client';

import { Box, List, ListItemButton, ListItemText, Button, Typography } from '@mui/material';
import type { Conversation } from '@/lib/chat';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ChatSidebar({ conversations, activeId, onSelect, onNew }: Props) {
  return (
    <Box sx={{ 
      width: 250, 
      borderRight: '1px solid', 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={onNew}
          sx={{ 
            textTransform: 'uppercase',
            fontWeight: 700,
            fontSize: '0.75rem',
          }}
        >
          Nova Conversa
        </Button>
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {conversations.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Nenhuma conversa ainda
            </Typography>
          </Box>
        ) : (
          conversations.map(conv => (
            <ListItemButton 
              key={conv.id} 
              selected={conv.id === activeId}
              onClick={() => onSelect(conv.id)}
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ListItemText 
                primary={conv.title} 
                secondary={conv.lastMessage}
                primaryTypographyProps={{ 
                  noWrap: true, 
                  fontSize: '0.875rem',
                  fontWeight: conv.id === activeId ? 700 : 400,
                }}
                secondaryTypographyProps={{ 
                  noWrap: true, 
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                }}
              />
            </ListItemButton>
          ))
        )}
      </List>
    </Box>
  );
}
