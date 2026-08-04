// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PasswordStrengthMeter } from '@/components/password-strength-meter';

describe('PasswordStrengthMeter', () => {
  it('should_render_default_prompt_when_empty', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container.textContent).toContain('DIGITE UMA SENHA');
    expect(container.textContent).toContain('FORÇA DA SENHA');
  });

  it('should_indicate_weak_password_when_only_short_characters', () => {
    const { container } = render(<PasswordStrengthMeter password="abc" />);
    expect(container.textContent).toContain('SENHA FRACA');
  });

  it('should_indicate_medium_password_when_partially_fulfilled', () => {
    const { container } = render(<PasswordStrengthMeter password="Password1" />);
    expect(container.textContent).toContain('SENHA MÉDIA');
  });

  it('should_indicate_strong_password_when_all_criteria_met', () => {
    const { container } = render(<PasswordStrengthMeter password="StrongP@ssword1" />);
    expect(container.textContent).toContain('SENHA FORTE');
  });

  it('should_show_match_status_when_passwords_match', () => {
    const { container } = render(
      <PasswordStrengthMeter password="StrongP@ssword1" confirmPassword="StrongP@ssword1" showMatchStatus={true} />
    );
    expect(container.textContent).toContain('SENHAS COINCIDEM');
  });

  it('should_show_mismatch_status_when_passwords_do_not_match', () => {
    const { container } = render(
      <PasswordStrengthMeter password="StrongP@ssword1" confirmPassword="DifferentPassword" showMatchStatus={true} />
    );
    expect(container.textContent).toContain('SENHAS NÃO COINCIDEM');
  });
});
