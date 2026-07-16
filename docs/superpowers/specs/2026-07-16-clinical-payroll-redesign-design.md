# IT On-call Clinical Payroll Sheet redesign

## Objective

Redesign the IT On-call Compensation Dashboard's visual language as a precise clinical-payroll audit sheet while preserving the current information architecture, component positions, data, copy, filters, calculations, interactions, responsive flow, access policy, and external integrations.

The primary audience is IT operations staff who monitor incidents and compensation, with finance reviewers and managers as the secondary audience. The page's single job remains making payable compensation and incident workload easy to verify in one view.

## Approved direction

The user selected and approved **Clinical Payroll Sheet (direction B)** from three visual concepts. The design should feel clean, formal, and auditable rather than decorative or futuristic.

The characteristic visual gesture is a cool-blue document grid combined with a red restricted-record spine on the incident ledger. The deliberate aesthetic risk is the italic serif treatment of “On-call,” which distinguishes the title while the rest of the interface stays disciplined.

## Visual tokens

### Color

- Cool paper: `#f8fbfd`
- Page field: `#eef3f7`
- Primary ink: `#102438`
- Cobalt action and data color: `#0759c7`
- Soft cobalt status surface: `#dfefff`
- Audit rule: `#8aa4ba`
- Cap-warning yellow: `#ffd43b`
- Restricted/error red: `#ea3150`
- White working surface: `#ffffff`
- Muted copy: `#5d7286`

Yellow is reserved for the cap-adjustment KPI and financial exceptions. Red is reserved for restricted information, errors, and destructive-severity messaging. Cobalt carries actions, live state, chart bars, headings, and table headers.

### Typography

- Display: `Noto Serif Thai` italic 600–700 for the “On-call” wordmark and restrained audit callouts.
- Interface and Thai copy: `IBM Plex Sans Thai` 400–700.
- Data, time, labels, and values: `IBM Plex Mono` 500–700.
- Provide system fallbacks so the dashboard remains readable if hosted fonts are unavailable.

The typography must preserve Thai legibility and use tabular-feeling monospace treatment for monetary values, countdowns, and compact utility labels.

### Shape, spacing, and motion

- Use square or near-square corners, one-pixel audit rules, and occasional three-to-four-pixel offset shadows.
- Keep the existing page widths and component positions.
- Use compact but breathable spacing with consistent 8/10/12-pixel grid increments.
- Limit motion to the live-state indicator and subtle hover/focus feedback.
- Respect `prefers-reduced-motion` and preserve visible keyboard focus.

## Component treatment

### Masthead and duty board

- Preserve the current two-column masthead and mobile stacking order.
- Replace the dark field with a white identity panel and soft-cobalt duty panel.
- Add a cobalt top rule and audit-grid dividers.
- Keep status, countdown, refresh control, rates, and copy exactly as they work today.
- Style errors with restricted red and a pale-red supporting surface; style loading and success with cobalt.

### Filters

- Preserve the four existing select controls and their order.
- Render each as a compact white worksheet field with a cobalt monospace label and audit-rule border.
- Keep native selects, accessible labels, touch targets, and current filtering behavior.

### KPI grid

- Preserve the five metrics and their grid spans.
- Use cobalt with white type for eligible compensation.
- Use white audit cards for shifts, Tele, and general incidents.
- Use warning yellow with dark ink for cap adjustment.
- Use monospace values and restrained offset rules instead of gradients or decorative icons.

### Analysis panels

- Preserve the four panels, their order, and the existing bar-based visualization.
- Use white panels, cobalt section rules, audit-rule borders, and small offset shadows.
- Keep the current data series and calculations unchanged.
- Strengthen zero and empty states with clear muted guidance without changing their wording or behavior.

### Incident ledger

- Preserve export behavior, restricted-information copy, columns, and data.
- Add the signature red spine and pale-red restricted notice.
- Use cobalt table headers, cool alternating row surfaces, and audit rules.
- Preserve horizontal scrolling and the current mobile behavior.

## Architecture and data flow

- Keep `OncallDashboard` responsible for fetch, refresh timing, filters, derived records, summaries, and CSV export.
- Keep presentational sections in `dashboard-sections.tsx` with their existing props and behavior.
- Concentrate the redesign in `app/globals.css`; change component markup only where a visual hook is strictly necessary and behavior-neutral.
- Keep `/api/incidents`, normalization, compensation calculations, live refresh cadence, and CSV generation unchanged.
- Keep the current site URL, access policy, and hosting configuration unchanged.

## Error, loading, and empty states

- Do not alter state transitions or error handling.
- Loading and success states use cobalt and soft-cobalt surfaces.
- Initial and refresh errors use restricted red with sufficient contrast.
- Disabled refresh controls remain visually distinct and retain the wait cursor.
- Empty panels remain instructional and use muted ink on the cool-paper surface.

## Responsive and accessibility requirements

- Preserve the existing desktop, tablet, and mobile content order.
- Maintain at least 44-pixel interactive targets.
- Preserve semantic headings, labels, tables, live regions, and focus behavior.
- Ensure primary text and control states meet WCAG AA contrast.
- Do not rely on color alone to communicate cap warnings, restricted information, or errors.

## Social preview

Refresh the existing social-preview image so it matches the approved cobalt, cool-paper, yellow, and red audit-sheet identity. Keep the current title and description unchanged and omit the new image if its text cannot be validated reliably.

## Scope boundaries

- No changes to content hierarchy, component positions, metrics, calculations, business rules, or user workflows.
- No new dashboard features, routes, persistence, authentication, or external data sources.
- No unrelated refactoring.
- Do not deploy until the redesigned local preview is approved.

## Validation

- Add a focused style regression test for the approved palette and semantic token roles.
- Run the complete Vitest suite.
- Run the production build.
- Verify the visual result in the browser at desktop and mobile widths, including loading/error/empty styling where practical.
- Confirm the final diff contains only visual-system changes, any strictly necessary behavior-neutral markup hooks, tests, metadata/social-preview updates, and approved design documentation.
- Save and deploy a new version to the existing Sites project only after final preview approval.
