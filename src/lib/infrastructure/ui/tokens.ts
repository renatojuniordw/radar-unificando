/**
 * Design tokens centralizados do Radar Unificando.
 * Substitui valores hardcoded espalhados em 30+ componentes.
 */
export const tokens = {
  /** Cor primária — texto, bordas, fundo de botões contained */
  primary: '#020617',
  /** Cor de destaque — botões CTA, badges, destaques */
  accent: '#ccff00',
  /** Accent no hover */
  accentHover: '#b8e600',
  /** Cinza médio — texto secundário, ícones, labels */
  muted: '#64748b',
  /** Fundo claro — cards, superfícies */
  surface: '#ffffff',
  /** Hover de superfícies claras */
  surfaceHover: '#f8fafc',
  /** Borda padrão de componentes */
  border: '2px solid #020617',
  /** Sombra estilo "brutal" usada em cards e botões */
  shadow: '3px 3px 0px #000',
  /** Fonte monospaced para códigos, scores e dados técnicos */
  fontMono: 'ui-monospace, monospace',
} as const;
