// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/lib/infrastructure/ui/theme-provider';
import { theme } from '@/lib/infrastructure/ui/theme';

const { MuiThemeProviderMock, CssBaselineMock } = vi.hoisted(() => ({
  MuiThemeProviderMock: vi.fn(),
  CssBaselineMock: vi.fn(),
}));

vi.mock('@mui/material', () => ({
  ThemeProvider: (props: any) => {
    MuiThemeProviderMock(props);
    return props.children;
  },
  CssBaseline: () => {
    CssBaselineMock();
    return null;
  },
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_render_children', () => {
    render(
      <ThemeProvider>
        <div>theme-child</div>
      </ThemeProvider>,
    );
    expect(screen.getByText('theme-child')).toBeTruthy();
  });

  it('should_pass_shared_theme_to_mui_provider', () => {
    render(
      <ThemeProvider>
        <div>c</div>
      </ThemeProvider>,
    );
    expect(MuiThemeProviderMock).toHaveBeenCalledTimes(1);
    expect(MuiThemeProviderMock.mock.calls[0][0].theme).toBe(theme);
  });

  it('should_wrap_children_inside_mui_theme_provider', () => {
    render(
      <ThemeProvider>
        <span>nested</span>
      </ThemeProvider>,
    );
    expect(MuiThemeProviderMock.mock.calls[0][0].children).toBeTruthy();
  });

  it('should_render_css_baseline', () => {
    render(
      <ThemeProvider>
        <div>c</div>
      </ThemeProvider>,
    );
    expect(CssBaselineMock).toHaveBeenCalledTimes(1);
  });

  it('should_apply_single_light_mode_theme_without_toggle', () => {
    // O provider aplica o tema único (light) — não existe toggle claro/escuro.
    expect(theme.palette.mode).toBe('light');
  });
});