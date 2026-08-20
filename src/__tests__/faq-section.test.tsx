// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/constants/home', () => ({
  FAQ_ITEMS: [
    { q: 'COMO FUNCIONA O RADAR DE VAGAS?', a: 'Buscamos automaticamente vagas abertas.' },
    { q: 'PRECISO CRIAR UMA CONTA?', a: 'Não. Você pode pesquisar vagas livremente.' },
    { q: 'AS VAGAS SÃO ATUALIZADAS?', a: 'As buscas ao vivo consultam em tempo real.' },
  ],
}));

vi.mock('lucide-react', () => ({
  HelpCircle: (props: any) => <svg data-testid="help-icon" {...props} />,
  ChevronDown: (props: any) => <svg data-testid="chevron-icon" {...props} />,
}));

import { FaqSection } from '@/components/home/faq-section';

describe('FaqSection', () => {
  it('should_render_faq_heading', () => {
    render(<FaqSection />);
    expect(screen.getByText('PERGUNTAS')).toBeTruthy();
    expect(screen.getByText('FREQUENTES')).toBeTruthy();
  });

  it('should_render_faq_badge', () => {
    render(<FaqSection />);
    expect(screen.getByText('DÚVIDAS FREQUENTES')).toBeTruthy();
  });

  it('should_render_all_faq_questions', () => {
    render(<FaqSection />);
    expect(screen.getByText('COMO FUNCIONA O RADAR DE VAGAS?')).toBeTruthy();
    expect(screen.getByText('PRECISO CRIAR UMA CONTA?')).toBeTruthy();
    expect(screen.getByText('AS VAGAS SÃO ATUALIZADAS?')).toBeTruthy();
  });

  it('should_render_faq_answers_when_details_opened', () => {
    render(<FaqSection />);
    const details = screen.getByText('COMO FUNCIONA O RADAR DE VAGAS?').closest('details');
    expect(details).toBeTruthy();
    fireEvent.click(details!.querySelector('summary')!);
    expect(screen.getByText('Buscamos automaticamente vagas abertas.')).toBeTruthy();
  });

  it('should_toggle_details_open_and_close', () => {
    render(<FaqSection />);
    const details = screen.getByText('PRECISO CRIAR UMA CONTA?').closest('details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    fireEvent.click(details.querySelector('summary')!);
    expect(details.open).toBe(true);
    fireEvent.click(details.querySelector('summary')!);
    expect(details.open).toBe(false);
  });
});
