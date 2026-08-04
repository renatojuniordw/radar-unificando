'use client';

import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label: string;
  error?: string;
  marginBottom?: number;
}

const labelStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  fontFamily: 'ui-monospace, monospace',
  display: 'block',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '4px solid #020617',
  padding: '10px 12px',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  boxShadow: '4px 4px 0px #000',
  boxSizing: 'border-box',
};

const errorStyle: React.CSSProperties = {
  color: '#dc2626',
  fontSize: '0.65rem',
  fontFamily: 'ui-monospace, monospace',
  margin: '4px 0 0',
  fontWeight: 700,
};

export function FormField({ label, error, id, marginBottom = 16, ...inputProps }: FormFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ marginBottom }}>
      <label htmlFor={fieldId} style={labelStyle}>
        {label}
      </label>
      <input id={fieldId} style={inputStyle} {...inputProps} />
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}
