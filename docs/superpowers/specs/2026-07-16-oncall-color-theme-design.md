# IT On-call dashboard color-theme design

## Goal

Apply the color theme from `it-oncall-compensation-dashboard-editorial-bento.html` to the existing IT On-call Compensation Dashboard without changing its content, layout, data flow, interactions, responsive behavior, or access settings.

## Approved direction

Use the attached HTML as the source of truth for color. Translate its palette into the existing site's CSS variables and dependent state colors while preserving the current component structure.

## Color system

- Paper background: `#f2f0e9`
- Primary ink: `#14202b`
- Petrol surface: `#123d46`
- Signal orange: `#f05a36`
- Cyan accent: `#249bb1`
- Rule/divider: `#c8c5bb`
- Chalk surface: `#fffdf7`
- Muted text: `#667076`
- Warning amber: `#9b6500`
- Error red: `#9a3444`

The existing `--petrol-deep` role will use a darker tonal extension derived from petrol so the duty panel retains its current hierarchy. All hard-coded supporting colors will be adjusted only where needed to harmonize with the reference palette and maintain readable contrast.

## Scope boundaries

- Keep the current React components and page composition.
- Keep all Thai and English copy unchanged.
- Keep filters, refresh behavior, charts, tables, CSV export, and live-data integration unchanged.
- Keep desktop, tablet, mobile, keyboard-focus, and reduced-motion behavior unchanged.
- Do not change site access, title, URL, or external data endpoints.
- Do not replace the existing social-preview image because this request is limited to the in-product theme.

## Validation

- Run the existing automated tests.
- Run the production build.
- Review the final diff to confirm that only theme styling and this design record changed.
- Save and deploy a new Sites version to the existing project URL.
