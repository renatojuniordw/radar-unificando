// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DicaCardGrid } from '@/components/dicas/dica-card-grid';

describe('DicaCardGrid', () => {
  it('should_render_children', () => {
    render(
      <DicaCardGrid>
        <div data-testid="card-1">Card 1</div>
        <div data-testid="card-2">Card 2</div>
      </DicaCardGrid>
    );
    expect(screen.getByTestId('card-1')).toBeTruthy();
    expect(screen.getByTestId('card-2')).toBeTruthy();
  });

  it('should_render_single_child', () => {
    render(
      <DicaCardGrid>
        <div>Single card</div>
      </DicaCardGrid>
    );
    expect(screen.getByText('Single card')).toBeTruthy();
  });

  it('should_render_multiple_children', () => {
    render(
      <DicaCardGrid>
        <span>First</span>
        <span>Second</span>
        <span>Third</span>
        <span>Fourth</span>
      </DicaCardGrid>
    );
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.getByText('Third')).toBeTruthy();
    expect(screen.getByText('Fourth')).toBeTruthy();
  });
});
