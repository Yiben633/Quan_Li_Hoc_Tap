# Frontend Design Notes

These notes distill reusable interface patterns from the local `Fe_skill`
reference repository. They are a design direction for StudyFlow, not a copy of
its code, assets, branding, or exact layouts.

## Reference Map

- `study4-test-library`: Vietnamese learning library, filter bars, resource cards,
  sidebar promotions, and pagination.
- `plainadmin-analytics-dashboard-ui`: operational dashboard shell, KPI grid,
  chart panel, mini calendar, and dense data table.
- `linear-change-interface-system-ui`: calm hierarchy, precise spacing, low-noise
  surfaces, compact navigation, and strong keyboard-oriented interaction.
- `canva-editor-ui-system`: editor shell, tool rail, inspector panel, control
  states, focus rings, modal, snackbar, and chip patterns.
- `superhi-learning-platform-ui`: course progress, learning steps, content cards,
  and friendly learning-flow composition.
- `healthy-together-public-health-saas-ui`: bold product hierarchy and expressive
  metric presentation, useful for selected empty states or onboarding moments.

## StudyFlow Visual Direction

StudyFlow is a repeated-use learning workspace, so the default experience should
be focused, scannable, and information-dense rather than a marketing landing
page.

- Use a light neutral canvas such as `#f5f7fb` with white working surfaces.
- Use deep navy or charcoal for primary text, blue for primary actions, green for
  success, amber for attention, and red for destructive or overdue states.
- Keep the palette balanced. Purple can be an accent, but it must not dominate
  the whole interface.
- Use a 240-260px desktop sidebar, a 56-64px top bar, and a content width around
  1200-1320px with 24px gutters.
- Use 6-8px radii for operational cards and 12px for dialogs or larger learning
  surfaces. Avoid cards nested inside cards.
- Use Plus Jakarta Sans, Inter, or a close system fallback. Body text should be
  comfortable at 14-16px; labels and metadata at 12-13px; section headings at
  roughly 22-28px.

## Core Screens

### Dashboard

Start with a compact KPI row, then show the progress chart, today's tasks, the
next calendar items, active goals, and current subjects. Keep the primary action
near the page title. Every panel needs loading, empty, error, and populated
states so the layout remains useful before data exists.

### Tasks And Kanban

Use segmented filters for status, priority, and subject. Task rows should expose
the title, due date, priority, subject color, and completion state without opening
an editor. The board should have four stable columns: Todo, In progress, Waiting,
and Done. Dragging must show a clear target state, and the server response should
replace the optimistic task after every move.

### Calendar

Use a day/week/month segmented control and a date navigator. Render schedules,
events, task deadlines, and exams through one event shape with `type`, `title`,
`startAt`, `endAt`, `colorHex`, and `sourceEntity`. Calendar cells need stable
dimensions so event labels cannot shift the grid.

### Study And Pomodoro

Make the active timer prominent but not oversized. Pair it with session context,
subject selection, pause/resume/end actions, and a small history or statistics
area. Persisting state should be reflected by an unmistakable active indicator.

### Notes And Documents

Use the editor-shell pattern from the Canva reference: a compact toolbar, a
focused editing area, and a narrow inspector for metadata. Keep the editor
unframed when possible; cards are reserved for individual documents, notes, and
dialogs. Show file type, size, tags, and ownership clearly.

### Flashcards And Groups

Flashcards should have a centered study surface, restrained progress feedback,
and fast correct/wrong actions. Study groups need member status, shared tasks,
and progress comparison without turning the screen into a decorative card wall.

## Interaction Rules

- Use Lucide icons where the frontend stack supports them. Add tooltips to
  unfamiliar icon-only buttons.
- Keep focus rings visible and provide keyboard-accessible controls.
- Use predictable states for hover, active, disabled, loading, success, and error.
- Use drawers on mobile for the sidebar and filters; do not squeeze desktop
  navigation into a narrow viewport.
- Give buttons, rows, columns, counters, and calendar cells stable dimensions.
- Prefer inline feedback, toast notifications, and contextual empty states over
  explanatory feature paragraphs.
- Use real product imagery only when it helps users inspect content. Avoid stock
  hero imagery for the core workspace.

## Motion And Color

Use one restrained motion language across future prompts and screens:

- Prefer 150-220ms transitions for controls and 4-6 second ease-in-out loops
  for ambient learning visuals.
- Use gradient accents only where they clarify hierarchy, such as auth artwork,
  progress fills, focus surfaces, and empty states. Keep operational panels
  mostly solid so data stays easy to scan.
- Combine blue with mint, green, or warm amber instead of making the whole app a
  single blue/purple gradient.
- Animate progress fills from zero, cards with a small vertical float, and
  decorative background geometry with very slow drift. Avoid bouncing or moving
  text that harms reading.
- Always include a `prefers-reduced-motion` fallback and never make animation
  necessary to complete an action.

## Implementation Order

1. Application shell: sidebar, top bar, responsive navigation, tokens, and route
   layout.
2. Dashboard: KPI, progress chart, today's tasks, calendar preview, and goals.
3. Tasks and kanban: filters, CRUD forms, drag/move, reorder, and responsive board.
4. Calendar and study timer: shared event model plus active-session state.
5. Notes, documents, grades, flashcards, groups, and admin surfaces.

The reference repository remains available locally at `references/Fe_skill` for
visual comparison while implementing the frontend.
