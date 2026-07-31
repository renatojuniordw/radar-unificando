'use client';

import { useRef } from 'react';
import { Chip } from '@mui/material';

interface Props {
  resumeText: string;
  onResumeTextChange: (v: string) => void;
  education: string[];
  resumeMarkdown: string | null;
  extracting: boolean;
  dragOver: boolean;
  onDragOver: (v: boolean) => void;
  onExtract: (input: File | string) => void;
}

export function ResumeUploadSection({
  resumeText, onResumeTextChange, education, resumeMarkdown,
  extracting, dragOver, onDragOver, onExtract,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="card-brutalist" style={{ padding: 24, marginBottom: 24 }}>
      <h3 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', fontSize: '0.9rem', margin: '0 0 16px' }}>
        CURRÍCULO
      </h3>
      <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Envie seu currículo para extrair skills automaticamente com IA.
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

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => onExtract(resumeText)}
          disabled={extracting || !resumeText}
          style={{
            border: '2px solid #020617', background: 'none', fontWeight: 900,
            padding: '10px 20px', cursor: extracting || !resumeText ? 'not-allowed' : 'pointer',
            fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: 'ui-monospace, monospace', opacity: extracting || !resumeText ? 0.5 : 1,
          }}
        >
          EXTRAIR SKILLS DO TEXTO
        </button>
      </div>

      {extracting && (
        <div style={{ marginBottom: 16 }} role="status" aria-live="polite">
          <div style={{ height: 4, background: '#334155' }}>
            <div style={{ height: '100%', width: '60%', background: '#ccff00', animation: 'pulse-glow 1s infinite' }} />
          </div>
          <p style={{ color: '#64748b', fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem', margin: '4px 0 0' }}>
            Extraindo skills com IA...
          </p>
        </div>
      )}

      {education.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', marginBottom: 6 }}>
            Formação
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {education.map((edu, i) => (
              <Chip key={i} label={edu} size="small" sx={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem' }} />
            ))}
          </div>
        </div>
      )}

      <label htmlFor="resume-text" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', display: 'block', marginBottom: 6 }}>
        Ou cole o texto do currículo
      </label>
      <textarea
        id="resume-text"
        rows={8}
        value={resumeText}
        onChange={e => onResumeTextChange(e.target.value)}
        placeholder="Cole aqui o texto do seu currículo (ex: LinkedIn export) e clique em EXTRAIR SKILLS DO TEXTO."
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '4px solid #020617',
          padding: 12,
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.75rem',
          boxShadow: '4px 4px 0px #000',
          resize: 'vertical',
        }}
        aria-describedby="resume-hint"
      />
      <p id="resume-hint" style={{ color: '#94a3b8', fontSize: '0.6rem', fontFamily: 'ui-monospace, monospace', margin: '4px 0 0' }}>
        Mínimo de 20 caracteres para extração.
      </p>

      {resumeMarkdown && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', color: '#64748b' }}>
            Ver currículo formatado
          </summary>
          <pre style={{
            marginTop: 8, padding: 12, border: '2px solid #e2e8f0',
            fontFamily: 'ui-monospace, monospace', fontSize: '0.65rem',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 400, overflow: 'auto', background: '#f8fafc',
          }}>
            {resumeMarkdown}
          </pre>
        </details>
      )}
    </div>
  );
}
