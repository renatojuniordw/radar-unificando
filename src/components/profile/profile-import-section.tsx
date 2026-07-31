'use client';

import { useRef } from 'react';
import { LinearProgress } from '@mui/material';

interface Props {
  extracting: boolean;
  dragOver: boolean;
  onDragOver: (v: boolean) => void;
  onExtract: (input: File | string) => void;
}

export function ProfileImportSection({ extracting, dragOver, onDragOver, onExtract }: Props) {
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
    <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
      <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: '0 0 8px' }}>
        IMPORTAR CURRÍCULO
      </h3>
      <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Faça upload do PDF do LinkedIn ou cole o texto do currículo.
      </p>

      <div
        onDragOver={e => { e.preventDefault(); onDragOver(true); }}
        onDragLeave={() => onDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `4px dashed ${dragOver ? '#ccff00' : '#020617'}`,
          backgroundColor: dragOver ? 'rgba(204, 255, 0, 0.05)' : '#f8fafc',
          padding: 32,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 16,
          transition: 'all 0.2s',
        }}
        role="button"
        tabIndex={0}
        aria-label="Arraste seu currículo ou clique para selecionar"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf,.txt,.doc,.docx"
          onChange={handleFileChange}
          disabled={extracting}
        />
        <p style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', color: dragOver ? '#ccff00' : '#020617', margin: 0 }}>
          {dragOver ? 'SOLTE O ARQUIVO AQUI' : 'Arraste PDF ou clique para enviar'}
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.6rem', fontFamily: 'ui-monospace, monospace', margin: '4px 0 0' }}>
          PDF · TXT · DOC · DOCX
        </p>
      </div>

      {extracting && (
        <div style={{ marginBottom: 16 }} role="status" aria-live="polite">
          <LinearProgress
            variant="indeterminate"
            sx={{ height: 4, mb: 0.5, '& .MuiLinearProgress-bar': { backgroundColor: '#ccff00' }, backgroundColor: '#334155' }}
          />
          <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', margin: 0 }}>
            Extraindo dados do currículo com IA...
          </p>
        </div>
      )}

      <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
        OU Cole o Texto do Currículo
      </p>
      <textarea
        ref={textareaRef}
        rows={6}
        placeholder="Cole aqui o conteúdo do LinkedIn ou currículo (mínimo 20 caracteres)"
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '4px solid #020617',
          padding: 12,
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.75rem',
          boxShadow: '4px 4px 0px #000',
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <p style={{ color: '#94a3b8', fontSize: '0.6rem', fontFamily: 'ui-monospace, monospace', margin: 0 }}>
          Mínimo de 20 caracteres
        </p>
        <button
          onClick={handleTextExtract}
          disabled={extracting}
          style={{
            border: '2px solid #020617', background: 'none', fontWeight: 900,
            padding: '8px 16px', cursor: extracting ? 'not-allowed' : 'pointer',
            fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: 'ui-monospace, monospace', opacity: extracting ? 0.5 : 1,
          }}
        >
          EXTRAIR DO TEXTO
        </button>
      </div>
    </div>
  );
}
