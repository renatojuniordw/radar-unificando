'use client';

import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label: string;
  error?: string;
  marginBottom?: number;
}

const labelStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  fontFamily: 'ui-monospace, monospace',
  display: 'block',
  marginBottom: 6,
  color: '#020617',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '3px solid #020617',
  backgroundColor: '#ffffff',
  color: '#020617',
  padding: '10px 12px',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  boxShadow: '3px 3px 0px #000',
  boxSizing: 'border-box',
  outline: 'none',
};

const errorStyle: React.CSSProperties = {
  color: '#dc2626',
  fontSize: '0.7rem',
  fontFamily: 'ui-monospace, monospace',
  margin: '6px 0 0',
  fontWeight: 800,
};

export function FormField({ label, error, id, marginBottom = 16, ...inputProps }: FormFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ marginBottom }}>
      <label htmlFor={fieldId} style={labelStyle}>
        {label}
      </label>
      <input id={fieldId} style={inputStyle} {...inputProps} />
      {error && <p style={errorStyle}>⚠️ {error}</p>}
    </div>
  );
}
