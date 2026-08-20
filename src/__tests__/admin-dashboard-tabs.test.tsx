// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDashboardTabs } from '@/components/admin/admin-dashboard-tabs';

describe('AdminDashboardTabs', () => {
  it('should render all tabs', () => {
    render(<AdminDashboardTabs activeTab="overview" onChangeTab={vi.fn()} />);

    expect(screen.getByText(/Visão Geral/)).toBeTruthy();
    expect(screen.getByText(/Buscas & Engajamento/)).toBeTruthy();
    expect(screen.getByText(/Infraestrutura & Custos/)).toBeTruthy();
  });

  it('should call onChangeTab when a tab is clicked', () => {
    const onChangeTab = vi.fn();
    render(<AdminDashboardTabs activeTab="overview" onChangeTab={onChangeTab} />);

    const searchTab = screen.getByRole('tab', { name: /Buscas & Engajamento/i });
    fireEvent.click(searchTab);

    expect(onChangeTab).toHaveBeenCalledWith('search');
  });

  it('should mark active tab with aria-selected', () => {
    render(<AdminDashboardTabs activeTab="search" onChangeTab={vi.fn()} />);

    const overviewTab = screen.getByRole('tab', { name: /Visão Geral/i });
    const searchTab = screen.getByRole('tab', { name: /Buscas & Engajamento/i });
    const infraTab = screen.getByRole('tab', { name: /Infraestrutura & Custos/i });

    expect(overviewTab.getAttribute('aria-selected')).toBe('false');
    expect(searchTab.getAttribute('aria-selected')).toBe('true');
    expect(infraTab.getAttribute('aria-selected')).toBe('false');
  });

  it('should have correct aria-controls and id attributes', () => {
    render(<AdminDashboardTabs activeTab="overview" onChangeTab={vi.fn()} />);

    const overviewTab = screen.getByRole('tab', { name: /Visão Geral/i });
    expect(overviewTab.getAttribute('id')).toBe('tab-overview');
    expect(overviewTab.getAttribute('aria-controls')).toBe('panel-overview');
  });

  it('should render tab descriptions', () => {
    render(<AdminDashboardTabs activeTab="overview" onChangeTab={vi.fn()} />);

    expect(screen.getByText(/Métricas principais de usuários/)).toBeTruthy();
    expect(screen.getByText(/Rankings de pesquisas/)).toBeTruthy();
    expect(screen.getByText(/Consumo de orçamento de IA/)).toBeTruthy();
  });
});
