// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useRouterMock } = vi.hoisted(() => ({ useRouterMock: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: useRouterMock }));

import { DateRangeFilter } from '@/components/admin/date-range-filter';

describe('DateRangeFilter', () => {
  const push = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useRouterMock.mockReturnValue({ push });
  });

  it('should_apply_preset_on_click', () => {
    render(<DateRangeFilter days={30} />);
    fireEvent.click(screen.getByText('15 dias'));
    expect(push).toHaveBeenCalledWith('/admin?days=15');
  });

  it('should_apply_custom_range_when_valid', () => {
    render(<DateRangeFilter days={30} />);
    fireEvent.click(screen.getByText('Personalizado'));
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-08-10' } });
    fireEvent.click(screen.getByText('Aplicar'));
    expect(push).toHaveBeenCalledWith('/admin?from=2026-08-01&to=2026-08-10');
  });

  it('should_not_apply_custom_range_when_from_after_to', () => {
    render(<DateRangeFilter days={30} />);
    fireEvent.click(screen.getByText('Personalizado'));
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-08-10' } });
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-08-01' } });
    fireEvent.click(screen.getByText('Aplicar'));
    expect(push).not.toHaveBeenCalled();
  });

  it('should_disable_apply_when_dates_missing', () => {
    render(<DateRangeFilter days={30} />);
    fireEvent.click(screen.getByText('Personalizado'));
    expect((screen.getByText('Aplicar') as HTMLButtonElement).disabled).toBe(true);
  });

  it('should_start_in_custom_mode_when_from_and_to_provided', () => {
    render(<DateRangeFilter days={30} from="2026-08-01" to="2026-08-10" />);
    expect(screen.getByLabelText('De')).toBeTruthy();
    expect(screen.getByLabelText('Até')).toBeTruthy();
  });
});