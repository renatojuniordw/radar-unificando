---
name: Radar Unificando Neo-Brutalist
version: 1.0.0
colors:
  primary: "#ccff00"
  dark-bg: "#020617"
  dark-surface: "#0f172a"
  dark-border: "#1e293b"
  light-surface: "#ffffff"
  light-border: "#020617"
  text-on-dark: "#f8fafc"
  text-muted-dark: "#94a3b8"
  text-on-light: "#020617"
  text-muted-light: "#64748b"
  accent-warning: "#f59e0b"
  accent-error: "#ef4444"
typography:
  headline-xl: { fontFamily: "Inter, sans-serif", fontSize: "36px", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }
  headline-lg: { fontFamily: "Inter, sans-serif", fontSize: "24px", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.01em" }
  headline-md: { fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, lineHeight: 1.3 }
  mono-badge: { fontFamily: "ui-monospace, monospace", fontSize: "11px", fontWeight: 900, letterSpacing: "0.05em" }
  body-md: { fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 400, lineHeight: 1.5 }
rounded:
  none: "0px"
  sm: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card-brutalist:
    backgroundColor: "{colors.light-surface}"
    borderColor: "{colors.light-border}"
    boxShadow: "6px 6px 0px #000"
    rounded: "{rounded.none}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.dark-bg}"
    borderColor: "{colors.dark-bg}"
    boxShadow: "3px 3px 0px #000"
    rounded: "{rounded.none}"
---

# Radar Unificando - Design Specification

## Overview
High-contrast, developer-centric neo-brutalist web application for job aggregation, ATS resume optimization, and skill development. Sharp edges, high contrast, vibrant acid lime (`#ccff00`) interactive elements, and crisp monospace typography accents.

## Colors
- **Primary Accent (#ccff00):** High-energy acid lime used for CTAs, active highlights, and badges.
- **Dark Canvas (#020617):** Deep midnight slate for section headers and high-contrast containers.
- **Light Surface (#ffffff):** Clean white cards with thick 2px-3px dark borders and hard drop shadows (`#000000`).
- **Muted Grays (#64748b, #94a3b8):** Secondary text and subtle borders.

## Typography
- **Headlines:** Inter / System Sans, extra-bold/black weight for strong hierarchy.
- **Badges & Labels:** Monospace (`ui-monospace, monospace`), uppercase, bold weight.
- **Body:** Inter / System Sans for optimal legibility.

## Layout & Components
- **Card Brutalist:** Solid white background, 3px `#020617` solid border, 0px border radius, 4px-6px hard offset black shadow.
- **Interactive Chips/Pills:** Segmented pill toggles with clear active/inactive visual states instead of ambiguous inline lines.
- **Search & Filters:** Unified search inputs, explicit filter grouping with visible labels.

## Do's and Don'ts
- **DO** use sharp 0px corners and bold borders for cards, buttons, and segmented controls.
- **DON'T** use floating single-pixel vertical lines between inline chips that look like broken artifacts.
- **DO** maintain high contrast between dark section headers and light result tables.
- **DON'T** duplicate search input fields across adjacent page blocks.
