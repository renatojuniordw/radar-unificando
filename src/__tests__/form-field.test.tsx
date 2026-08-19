// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '@/components/ui/form-field';

describe('FormField', () => {
  it('should_render_label_and_input', () => {
    render(<FormField label="Email" type="email" />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('should_derive_id_from_label_when_not_provided', () => {
    render(<FormField label="Nome Completo" />);
    const input = screen.getByLabelText('Nome Completo') as HTMLInputElement;
    expect(input.id).toBe('nome-completo');
  });

  it('should_use_provided_id', () => {
    render(<FormField label="Email" id="custom-id" />);
    expect((screen.getByLabelText('Email') as HTMLInputElement).id).toBe('custom-id');
  });

  it('should_show_error_message_when_present', () => {
    render(<FormField label="Senha" error="Campo obrigatório" />);
    expect(screen.getByText(/Campo obrigatório/)).toBeTruthy();
  });

  it('should_not_show_error_when_absent', () => {
    render(<FormField label="Senha" />);
    expect(screen.queryByText(/⚠️/)).toBeNull();
  });

  it('should_pass_through_input_props', () => {
    render(<FormField label="Email" placeholder="voce@exemplo.com" required />);
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.placeholder).toBe('voce@exemplo.com');
    expect(input.required).toBe(true);
  });
});