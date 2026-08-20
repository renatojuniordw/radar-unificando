'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Box, Typography } from '@mui/material';
import { tokens } from "@/lib/infrastructure/ui/tokens";

interface SkillInputProps {
  skills: string[];
  allSuggestions: string[];
  areaSkills?: string[];
  onAddSkill: (skill: string) => void;
  onAddSkills: (skills: string[]) => void;
  onRemoveSkill: (skill: string) => void;
}

export function SkillInput({
  skills,
  allSuggestions,
  areaSkills = [],
  onAddSkill,
  onAddSkills,
  onRemoveSkill,
}: SkillInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalização para comparar sem diferenciar case
  const normalizedSelectedSkills = skills.map(s => s.trim().toLowerCase());

  // Sugestões filtradas baseadas no texto digitado
  const filteredSuggestions = allSuggestions
    .filter(
      s =>
        !normalizedSelectedSkills.includes(s.trim().toLowerCase()) &&
        s.toLowerCase().includes(inputValue.trim().toLowerCase())
    )
    .slice(0, 8);

  // Sugestões rápidas por área (ex: para a área do usuário)
  const quickSuggestions = areaSkills
    .filter(s => !normalizedSelectedSkills.includes(s.trim().toLowerCase()))
    .slice(0, 10);

  // Reset selectedIndex ao mudar a busca
  function handleInputChange(text: string) {
    setInputValue(text);
    setSelectedIndex(0);
    setIsOpen(true);
  }

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function commitInput(text: string) {
    if (!text.trim()) return;

    // Divide por vírgula, ponto-e-vírgula ou quebra de linha
    const parts = text
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      onAddSkills(parts);
    } else if (parts.length === 1) {
      onAddSkill(parts[0]);
    }

    setInputValue('');
    setIsOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
      // Se tiver sugestão aberta e o usuário navegou até ela com Enter
      if (isOpen && filteredSuggestions.length > 0 && e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredSuggestions[selectedIndex] || filteredSuggestions[0];
        commitInput(selected);
        return;
      }

      // Adiciona o texto atual
      if (inputValue.trim()) {
        e.preventDefault();
        commitInput(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      if (filteredSuggestions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (filteredSuggestions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      onRemoveSkill(skills[skills.length - 1]);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    commitInput(pastedText);
  }

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', mb: 2 }}>
      {/* Campo de Busca & Tags */}
      <Box
        onClick={() => inputRef.current?.focus()}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          p: 1.5,
          border: '4px solid #020617',
          bgcolor: tokens.surface,
          boxShadow: '4px 4px 0px #000',
          minHeight: 56,
          alignItems: 'center',
          cursor: 'text',
        }}
      >
        {/* Renderização das Tags Adicionadas */}
        {skills.map(skill => (
          <Box
            key={skill}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              border: tokens.border,
              bgcolor: '#f1f5f9',
              color: tokens.primary,
              px: 1.2,
              py: 0.5,
              fontWeight: 800,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              fontFamily: tokens.fontMono,
            }}
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onRemoveSkill(skill);
              }}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 900,
                color: '#dc2626',
                padding: '0 2px',
                fontSize: '0.85rem',
                lineHeight: 1,
              }}
              title="Remover skill"
            >
              ×
            </button>
          </Box>
        ))}

        {/* Input de Digitação */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            skills.length === 0
              ? 'Digite skills (ex: Python, SQL) — aperte Enter, vírgula ou cole em lote...'
              : 'Adicionar mais skills (Enter ou vírgula)...'
          }
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            minWidth: 180,
            fontFamily: tokens.fontMono,
            fontSize: '0.8rem',
            padding: '6px 0',
            background: 'transparent',
            color: tokens.primary,
          }}
        />
      </Box>

      {/* Dica de Uso */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 0.8,
          mb: 1.5,
          color: tokens.muted,
          fontFamily: tokens.fontMono,
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        💡 Dica: Separe com vírgula ou Enter para adicionar em lote (ou cole várias de uma vez).
      </Typography>

      {/* Dropdown de Autocomplete */}
      {isOpen && inputValue.trim().length > 0 && filteredSuggestions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            bgcolor: tokens.surface,
            border: '4px solid #020617',
            boxShadow: '6px 6px 0px #000',
            mt: 0.5,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {filteredSuggestions.map((suggestion, idx) => (
            <Box
              key={suggestion}
              onClick={() => commitInput(suggestion)}
              onMouseEnter={() => setSelectedIndex(idx)}
              sx={{
                p: 1.2,
                px: 2,
                cursor: 'pointer',
                fontFamily: tokens.fontMono,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                bgcolor: idx === selectedIndex ? tokens.accent : 'transparent',
                color: tokens.primary,
                borderBottom: idx === filteredSuggestions.length - 1 ? 'none' : '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{suggestion}</span>
              <span style={{ fontSize: '0.65rem', color: idx === selectedIndex ? tokens.primary : '#94a3b8' }}>
                ↵ Adicionar
              </span>
            </Box>
          ))}
        </Box>
      )}

      {/* Sugestões Rápidas de 1-Clique por Área */}
      {quickSuggestions.length > 0 && (
        <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
          <Typography
            sx={{
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontSize: '0.65rem',
              fontFamily: tokens.fontMono,
              mr: 0.5,
            }}
          >
            Sugestões Rápidas:
          </Typography>
          {quickSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onAddSkill(s)}
              style={{
                fontWeight: 700,
                fontSize: '0.65rem',
                cursor: 'pointer',
                border: tokens.border,
                color: tokens.primary,
                background: tokens.surfaceHover,
                padding: '3px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                fontFamily: tokens.fontMono,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = tokens.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = tokens.surfaceHover;
              }}
            >
              + {s}
            </button>
          ))}
        </Box>
      )}
    </Box>
  );
}
