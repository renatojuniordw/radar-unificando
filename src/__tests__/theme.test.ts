import { describe, it, expect } from 'vitest';
import { theme } from '@/lib/infrastructure/ui/theme';

describe('theme', () => {
  it('should export a theme object', () => {
    expect(theme).toBeDefined();
    expect(typeof theme).toBe('object');
  });

  it('should have a palette configuration', () => {
    expect(theme.palette).toBeDefined();
    expect(theme.palette.mode).toBe('light');
  });

  it('should have primary color set to #020617', () => {
    expect(theme.palette.primary.main).toBe('#020617');
  });

  it('should have secondary color set to #64748b', () => {
    expect(theme.palette.secondary.main).toBe('#64748b');
  });

  it('should have warning color set to #ccff00', () => {
    expect(theme.palette.warning.main).toBe('#ccff00');
  });

  it('should have success color set to #16a34a', () => {
    expect(theme.palette.success.main).toBe('#16a34a');
  });

  it('should have error color set to #dc2626', () => {
    expect(theme.palette.error.main).toBe('#dc2626');
  });

  it('should have typography configuration', () => {
    expect(theme.typography).toBeDefined();
    expect(theme.typography.fontFamily).toContain('Inter');
  });

  it('should have h1 with fontWeight 900', () => {
    expect(theme.typography.h1?.fontWeight).toBe(900);
  });

  it('should have h2 with fontWeight 900', () => {
    expect(theme.typography.h2?.fontWeight).toBe(900);
  });

  it('should have h3 with fontWeight 700', () => {
    expect(theme.typography.h3?.fontWeight).toBe(700);
  });

  it('should have button typography with textTransform none', () => {
    expect(theme.typography.button?.textTransform).toBe('none');
    expect(theme.typography.button?.fontWeight).toBe(700);
  });

  it('should have shape configuration with borderRadius', () => {
    expect(theme.shape).toBeDefined();
    expect(theme.shape.borderRadius).toBe(4);
  });

  it('should have MuiButton component overrides', () => {
    expect(theme.components?.MuiButton).toBeDefined();
    expect(theme.components?.MuiButton?.defaultProps?.disableElevation).toBe(true);
  });

  it('should have MuiCard component overrides', () => {
    expect(theme.components?.MuiCard).toBeDefined();
    expect(theme.components?.MuiCard?.defaultProps?.variant).toBe('outlined');
  });

  it('should have MuiTextField component overrides', () => {
    expect(theme.components?.MuiTextField).toBeDefined();
    expect(theme.components?.MuiTextField?.defaultProps?.size).toBe('small');
  });
});
