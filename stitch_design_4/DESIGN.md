---
name: Precision Analytics Interface
colors:
  surface: '#13131b'
  surface-dim: '#13131b'
  surface-bright: '#393841'
  surface-container-lowest: '#0d0d15'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#292932'
  surface-container-highest: '#34343d'
  on-surface: '#e4e1ed'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e4e1ed'
  inverse-on-surface: '#303038'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#13131b'
  on-background: '#e4e1ed'
  surface-variant: '#34343d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar_width: 220px
  max_content_width: 1280px
---

## Brand & Style
The design system focuses on high-utility, B2B professionalism. It targets SaaS founders and operators who require clarity, speed, and precision. The aesthetic is rooted in **Corporate Minimalism** with a developer-centric lean, utilizing a "Dark Mode" first approach to reduce eye strain during deep data analysis.

The visual narrative is built on "Utility-First" principles:
- **Efficiency:** Interfaces are data-dense but maintain legibility through strict spatial logic.
- **Reliability:** A neutral, dark canvas allows data visualizations and primary accents to command attention without visual noise.
- **Sophistication:** Subtle borders and monochromatic depth replace heavy shadows, creating a refined, "pro-tool" atmosphere similar to high-end engineering environments.

## Colors
The palette is engineered for a high-contrast dark environment. 
- **Core Surfaces:** The background uses a deep charcoal to ground the UI, while surfaces use a lifted navy-gray to create a clear container hierarchy.
- **Accents:** Indigo is the sole driver of action. Use it sparingly for primary calls-to-action and active navigation states.
- **Semantic Logic:** Green, Amber, and Red are reserved strictly for status-driven data (e.g., pricing lift, churn risk, or error states).
- **Borders:** Use the defined border color for all structural divisions. Avoid using pure black or high-contrast white.

## Typography
The system relies exclusively on **Inter** to maintain a systematic, neutral tone. 
- **Hierarchical Contrast:** Use `display-lg` and `headline-md` for page titles and section headers in primary text color.
- **Secondary Information:** Use `body-sm` in the muted gray for descriptions. 
- **Metadata:** Use `label-caps` for table headers and small category descriptors to provide clear visual anchors without overwhelming the data.
- **Monospace fallback:** For numerical data or pricing tables, ensure tabular lining figures are enabled to maintain vertical alignment in columns.

## Layout & Spacing
The design follows an **8px linear scale**. 
- **Sidebar:** A fixed 220px left navigation provides persistent access. It should use a slightly darker or distinct background treatment from the main content.
- **Shell:** The main content area is capped at 1280px to ensure line lengths remain readable on ultra-wide monitors.
- **Card Padding:** Use `lg` (24px) or `xl` (32px) padding within data cards to prevent density fatigue.
- **Responsive Behavior:** On tablet, the sidebar collapses into a hamburger menu. On mobile, cards stack vertically and padding is reduced to `md` (16px).

## Elevation & Depth
This system eschews traditional shadows in favor of **Tonal Layering** and **Subtle Outlines**.
- **Level 0 (Background):** Base layer (#0f1117).
- **Level 1 (Cards/Sidebar):** Raised surface (#181c27) with a 1px solid border (#2a2f45).
- **Level 2 (Popovers/Modals):** Floating elements use the same surface color but include a subtle ambient shadow (0px 4px 20px rgba(0,0,0,0.5)) and a slightly brighter border (#3f445e) to define the edge against other surfaces.
- **Interaction:** On hover, interactive cards should transition their border color to a slightly lighter gray rather than changing the background color.

## Shapes
A consistent "Rounded" profile is applied to all structural elements. 
- **Cards & Containers:** Use 0.5rem (8px) for standard containers.
- **Inputs & Buttons:** Maintain the 8px radius to match container logic.
- **Status Pills:** Use the `rounded-xl` (1.5rem) setting to create fully pill-shaped indicators for statuses, distinguishing them from interactive buttons.

## Components
- **Buttons:** 
  - *Primary:* Indigo background, white text. No gradient.
  - *Secondary:* Transparent background with the system border (#2a2f45).
- **Input Fields:** Darker background than the card surface, 1px border. Focus state uses an indigo border with a subtle indigo outer glow (2px).
- **Status Badges:** Low-opacity backgrounds (10-15%) of the semantic color (Green/Amber/Red) with high-contrast text of the same hue.
- **Data Tables:** Borderless rows with a 1px divider between them. Header row uses `label-caps` typography.
- **Wizard Stepper:** Horizontal line connectors with numbered circles. Active step is indigo; completed steps are indigo with a checkmark; future steps are muted gray.
- **Progress Bars:** For "Analysis Loading" states, use a thick 8px bar with a pulse animation on the indigo fill.