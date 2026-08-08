'use client';

import { useRef } from 'react';
import { LinearProgress } from '@mui/material';
import { BaseCard } from '@/components/ui/base-card';

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
      {extracting && <LinearProgress sx={{ mb: 2, height: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#020617' } }} />}

      <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', marginBottom: 16, lineHeight: 1.6 }}>
        Upload do PDF do LinkedIn ou cole o texto do currículo. A IA extrai skills, experiência e formação automaticamente.
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
          border: `3px dashed ${dragOver ? '#ccff00' : '#020617'}`,
          backgroundColor: dragOver ? 'rgba(204, 255, 0, 0.05)' : '#f8fafc',
          padding: 24,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.75rem', color: dragOver ? '#ccff00' : '#020617' }}>
          {dragOver ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar PDF'}
        </p>
        <p style={{ margin: '4px 0 0', fontFamily: 'ui-monospace, monospace', fontSize: '0.6rem', color: '#64748b' }}>
          Formato aceito: PDF do LinkedIn
        </p>
      </div>

      {/* Textarea */}
      <div>
        <p style={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', marginBottom: 6, color: '#64748b' }}>
          Ou cole o texto do currículo
        </p>
        <textarea
          ref={textareaRef}
          rows={4}
          placeholder="Cole aqui o conteúdo do seu currículo..."
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '3px solid #020617', padding: 12,
            fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem',
            resize: 'vertical',
          }}
        />
        <button
          onClick={handleTextExtract}
          disabled={extracting}
          style={{
            marginTop: 8, border: '2px solid #020617', background: 'transparent',
            fontWeight: 700, padding: '6px 16px', cursor: 'pointer',
            fontSize: '0.65rem', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace',
          }}
        >
          {extracting ? 'Extraindo...' : 'Extrair do texto'}
        </button>
      </div>
    </BaseCard>
  );
}
