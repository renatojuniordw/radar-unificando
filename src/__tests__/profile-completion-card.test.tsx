// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileCompletionCard } from '@/components/profile/profile-completion-card';

function renderCard(
  overrides: Partial<Parameters<typeof ProfileCompletionCard>[0]> = {},
) {
  return render(
    <ProfileCompletionCard
      percent={50}
      completedCount={3}
      totalCount={6}
      checks={[
        { label: 'Skills (mín. 3)', done: true },
        { label: 'Senioridade', done: false },
        { label: 'Experiência', done: true },
      ]}
      {...overrides}
    />,
  );
}

describe('ProfileCompletionCard', () => {
  it('should_render_card_with_testid', () => {
    renderCard();
    expect(screen.getByTestId('profile-completion-card')).toBeTruthy();
  });

  it('should_render_perfil_completo_title', () => {
    renderCard();
    expect(screen.getByText('PERFIL COMPLETO')).toBeTruthy();
  });

  it('should_render_completed_items_counter', () => {
    renderCard();
    expect(screen.getByText('3/6 ITENS')).toBeTruthy();
  });

  it('should_render_all_check_labels', () => {
    renderCard();
    expect(screen.getByText('Skills (mín. 3)')).toBeTruthy();
    expect(screen.getByText('Senioridade')).toBeTruthy();
    expect(screen.getByText('Experiência')).toBeTruthy();
  });

  it('should_render_one_item_per_check', () => {
    renderCard({ checks: [{ label: 'A', done: true }, { label: 'B', done: false }] });
    expect(screen.getAllByTestId('profile-completion-item')).toHaveLength(2);
  });

  it('should_render_zero_items_when_checks_empty', () => {
    renderCard({ checks: [] });
    expect(screen.queryAllByTestId('profile-completion-item')).toHaveLength(0);
  });

  it('should_apply_percent_width_to_progress_bar', () => {
    const { container } = renderCard({ percent: 75 });
    const bar = container.querySelector('[data-testid="profile-completion-card"] div div');
    expect(bar).toBeTruthy();
    expect((bar as HTMLElement).style.width).toBe('75%');
  });

  it('should_apply_zero_width_when_percent_is_zero', () => {
    const { container } = renderCard({ percent: 0 });
    const bar = container.querySelector('[data-testid="profile-completion-card"] div div');
    expect((bar as HTMLElement).style.width).toBe('0%');
  });

  it('should_render_check_icon_for_done_item', () => {
    const { container } = renderCard();
    expect(container.querySelector('svg.text-emerald-600')).toBeTruthy();
  });

  it('should_render_cross_icon_for_pending_item', () => {
    const { container } = renderCard();
    expect(container.querySelector('svg.text-slate-300')).toBeTruthy();
  });
});