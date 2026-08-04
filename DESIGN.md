---
name: Radar Unificando Neo-Brutalism & Premium SaaS
description: Visual Identity and Tokens for the Radar Unificando job board. A high-contrast Dark-Mode Neo-Brutalist design combined with Premium SaaS elements (micro-animations, glowing borders, custom previews).
colors:
  primary: "#ccff00"       # Neon Yellow/Green
  secondary: "#020617"     # Dark Slate / Brutalist Black
  surface: "#0f172a"       # Slate 900
  surface-light: "#1e293b" # Slate 800
  neutral-light: "#f8fafc" # Slate 50
  neutral-muted: "#94a3b8" # Slate 400
  neutral-dark: "#334155"  # Slate 700
  white: "#ffffff"
  error: "#ff4d4d"
  success: "#00ff66"
typography:
  headline-display:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 900
    lineHeight: 1.0
    letterSpacing: -0.02em
  body-mono:
    fontFamily: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: 0.05em
  label-mono:
    fontFamily: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace
    fontSize: 10px
    fontWeight: 900
    lineHeight: 1.0
    letterSpacing: 0.3em
rounded:
  none: 0px
  sm: 2px
  md: 4px
  lg: 8px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
components:
  card-brutalist:
    backgroundColor: "{colors.white}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.none}"
    border: "4px solid {colors.secondary}"
    shadow: "8px 8px 0px #000"
  btn-neon:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.none}"
    border: "4px solid {colors.secondary}"
    shadow: "8px 8px 0px #000"
  badge-neon:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.none}"
    border: "2px solid {colors.secondary}"
    shadow: "4px 4px 0px {colors.white}"
---

# Radar Unificando Design System

## Overview
Radar Unificando is a job search engine that helps remote workers find jobs on platforms like Gupy and InHire. 
The visual design style is **Neo-Brutalism**. It projects speed, direct utility, and raw power. 
To improve conversion rates from paid ads, we are blending this raw look with a **Premium SaaS Feel**—using glowing conic gradients, clean structured information, micro-animations, and preview cards that immediately show product features above the fold.

## Colors
- **Primary Accent (`#ccff00`)**: Neon Yellow/Green. Used for key headlines, main CTA button backgrounds, and high-visibility borders/badges.
- **Secondary/Background (`#020617`)**: Pure Dark Slate. Serves as the primary canvas for the app.
- **Surface Level 1 (`#0f172a`)**: Slate 900. Used for background of inputs, forms, and cards to create depth.
- **Surface Level 2 (`#1e293b`)**: Slate 800. Used for card components and borders.

## Typography
- **Headlines**: Bold, uppercase sans-serif (`Inter`), with negative letter-spacing for tight, punchy headings.
- **Support & Details**: Monospace (`ui-monospace`, `SF Mono`), giving a developer/terminal feel to secondary descriptions, status indicators, and tooltips.

## Layout
- **Hero**: Single content column (max-width 720px) — badge, heading, inputs and CTA stacked vertically over a conic neon radar backdrop. No side preview panels.
- **Padding**: Vertical spacing is large (`py: 5` to `py: 8`) to let sections breathe despite the thick, harsh borders.

## Elevation & Depth
- **Hard Offsets**: No soft blur shadows by default. Depth is achieved via hard offset shadows (`8px 8px 0px #000` or `#ccff00`).
- **Depth Overlays**: Use semi-transparent overlays (`rgba(204, 255, 0, 0.05)`) with neon borders to indicate focus or premium status.

## Shapes
- **Sharp Geometry**: Default border-radius is `0px` (or `2px` for subtle softness on inputs/badges). 
- Avoid curves like `rounded-xl` or `rounded-2xl` unless explicitly overridden for specific components (like avatar circles).

## Components
- **Search Inputs**: Thick black borders, dark backgrounds, high-contrast text.
- **Suggestion chips**: Monospace uppercase chips that fill the cargo input on click, with neon hover state.
- **Result table**: Monospace header with uppercase labels, compact rows, optional JobPosting structured data.

## Do's and Don'ts
- **DO** use `#ccff00` for active states and critical CTAs.
- **DO** keep the text clean, readable, and uppercase for headers.
- **DON'T** use purple or generic blue/cyan gradients (strictly forbidden under the Purple Ban).
- **DON'T** add round borders (`border-radius > 4px`) to brutalist cards or buttons.
