---
name: Frost AI
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#414754'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#727785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#575f6b'
  on-secondary: '#ffffff'
  secondary-container: '#dce3f2'
  on-secondary-container: '#5d6571'
  tertiary: '#5b5e63'
  on-tertiary: '#ffffff'
  tertiary-container: '#74777b'
  on-tertiary-container: '#030507'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#dce3f2'
  secondary-fixed-dim: '#c0c7d5'
  on-secondary-fixed: '#151c26'
  on-secondary-fixed-variant: '#404753'
  tertiary-fixed: '#e0e2e7'
  tertiary-fixed-dim: '#c4c6cb'
  on-tertiary-fixed: '#181c20'
  on-tertiary-fixed-variant: '#44474b'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Open Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Open Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-desktop: 48px
  container-padding-mobile: 20px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system embodies a forward-looking, "2026 Frost" aesthetic—a sophisticated evolution of modern AI interfaces. It prioritizes clarity, intelligence, and atmospheric depth. The target audience includes developers, creative professionals, and power users who require a high-performance workspace that feels calm and expansive rather than cluttered.

The style is a hybrid of **Minimalism** and **Advanced Glassmorphism**. It leverages high-refraction frosted surfaces, luminous washes of color, and microscopic detail to create a "glass-on-light" effect. The UI should evoke a sense of weightlessness, as if the interface is projected onto a sheet of ethereal frost.

## Colors
The palette is dominated by **luminous whites and lavender-tinted blues**, creating an atmospheric environment that minimizes eye strain while feeling premium.

- **Primary:** High-vibrancy Google Blue (#1A73E8) is reserved strictly for high-priority actions and active states.
- **Surface:** The background uses a gradient wash from Pure White to Luminous Lavender-Blue (#E8EFFE).
- **Secondary/Tertiary:** Subdued tints of blue and lavender are used for container backgrounds to differentiate functional zones without using hard lines.
- **Functional:** Success, warning, and error states should use desaturated versions of their respective hues to maintain the soft aesthetic.

## Typography
The typography strategy balances high-tech precision with hyper-legibility. 

- **Headlines:** Plus Jakarta Sans provides a contemporary, geometric feel with slightly tighter letter-spacing for large displays.
- **Body:** Open Sans is utilized for its exceptional readability in data-dense AI environments, ensuring long-form content is accessible.
- **Labels:** Plus Jakarta Sans in medium and bold weights is used for UI controls and metadata to maintain a clean, organized look.

## Layout & Spacing
The layout philosophy is defined by **expansive whitespace** and an airy composition. Elements are given significant room to breathe, preventing the "frosted" surfaces from feeling cluttered.

- **Grid:** A 12-column fluid grid is used for desktop, transitioning to a 4-column grid for mobile.
- **Safe Areas:** Large margins (48px+) are preferred on desktop to center the user's focus.
- **Reflow:** On smaller screens, sidebars transition into bottom-sheet drawers or full-screen overlays to preserve the sense of depth.

## Elevation & Depth
Depth is communicated through **layered translucency** rather than traditional drop shadows.

- **Frosted Glass:** Use `backdrop-blur-xl` (minimum 20px-40px blur) for all floating panels and navigation bars.
- **Borders:** Surfaces are defined by 0.5px or 1px solid white borders with 15-20% opacity. This creates a "glass edge" that catches the light.
- **Inner Glows:** Apply a subtle 1px inner white stroke (top-down) to buttons and cards to simulate refraction.
- **Layering:** Elements closer to the user are more opaque and have higher blur values. The base layer is the luminous lavender wash.

## Shapes
The shape language is organic and friendly, utilizing generous radii to soften the high-tech aesthetic. 

- **Standard Containers:** Use 16px (`rounded-lg`) for cards and input fields.
- **Large Layout Blocks:** Use 24px (`rounded-xl`) for main content areas and large modal containers.
- **Interactive Elements:** Buttons and chips use high-roundedness or full pill shapes to invite interaction.

## Components
- **Buttons:** Primary buttons use a solid #1A73E8 fill with white text. Secondary buttons use the frosted glass treatment with a 1px white border and primary-colored text.
- **Input Fields:** Semi-transparent white backgrounds with a subtle inner glow. On focus, the 0.5px border transitions to the primary blue.
- **Chips:** Highly rounded (pill) with a soft lavender-blue tint. Active chips use the primary blue with low opacity (10%).
- **Cards:** Use `backdrop-blur-lg` with a white border. Content should be grouped with ample padding (24px+).
- **AI Response Containers:** Distinguished by a very subtle gradient border (Lavender to Blue) to signify "generated" content.
- **Floating Action Buttons (FAB):** Highly blurred glass circles with a centered primary-colored icon, appearing to float above all other layers.