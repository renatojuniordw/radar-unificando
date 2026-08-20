'use client';

import { useRef } from 'react';
import { LinearProgress } from '@mui/material';
import { BaseCard } from '@/components/ui/base-card';
import { tokens } from "@/lib/infrastructure/ui/tokens";

interface Props {
  title?: string;
  extracting: boolean;
  dragOver: boolean;
  onDragOver: (v: boolean) => void;
  onExtract: (input: File | string) => void;
}

export function ProfileImportSection({ title = 'IMPORTAR CURRÍCULO', extracting, dragOver, onDragOver, onExtract }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    onDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      onExtract(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      onExtract(e.target.files[0]);
    }
  }

  function handleTextExtract() {
    const text = textareaRef.current?.value || '';
    if (text.trim().length >= 20) {
      onExtract(text);
    }
  }

  return (
    <BaseCard title={title}>
      {extracting && (
        <LinearProgress
          sx={{
            mb: 2,
            height: 6,
            bgcolor: '#e2e8f0',
            border: tokens.border,
            '& .MuiLinearProgress-bar': { bgcolor: tokens.accent },
          }}
        />
      )}

      <p style={{ color: '#334155', fontFamily: tokens.fontMono, fontSize: '0.7rem', marginBottom: 16, lineHeight: 1.6, fontWeight: 700 }}>
        Faça upload do seu currículo em PDF do LinkedIn ou cole o texto. A IA extrai automaticamente suas habilidades, cargos e formação.
      </p>

      {/* Upload PDF */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Selecionar arquivo PDF do currículo"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={e => { e.preventDefault(); onDragOver(true); }}
        onDragLeave={() => onDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '3px dashed #020617',
          backgroundColor: dragOver ? tokens.accent : tokens.surfaceHover,
          padding: 24,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 20,
          boxShadow: tokens.shadow,
          transition: 'background-color 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', color: tokens.primary, textTransform: 'uppercase', fontFamily: tokens.fontMono }}>
          {dragOver ? '⚡ Solte o arquivo PDF aqui' : '📄 Arraste ou clique para selecionar PDF'}
        </p>
        <p style={{ margin: '4px 0 0', fontFamily: tokens.fontMono, fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>
          Formato aceito: PDF gerado pelo LinkedIn
        </p>
      </div>

      {/* Textarea */}
      <div>
        <p style={{ fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: tokens.fontMono, marginBottom: 6, color: tokens.primary }}>
          Ou cole o texto completo do currículo
        </p>
        <textarea
          ref={textareaRef}
          rows={4}
          placeholder="Cole aqui o conteúdo textual do seu currículo..."
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '3px solid #020617', padding: 12,
            fontFamily: tokens.fontMono, fontSize: '0.75rem',
            color: tokens.primary, backgroundColor: tokens.surface,
            resize: 'vertical', boxShadow: tokens.shadow,
            fontWeight: 600,
          }}
        />
        <button
          onClick={handleTextExtract}
          disabled={extracting}
          className="btn-dark"
          style={{
            marginTop: 12, padding: '10px 24px',
            fontSize: '0.7rem', border: '3px solid #020617',
          }}
        >
          {extracting ? 'EXTRAINDO...' : 'EXTRAIR DO TEXTO'}
        </button>
      </div>
    </BaseCard>
  );
}
