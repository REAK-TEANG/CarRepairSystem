# Deep Frontend UI/UX Audit, Visual Bug Fixes & Design Skill Integration

## Role

Act as a Senior Frontend Engineer, UI/UX Designer, Design Systems Architect, and Frontend QA Engineer.

Your mission is to deeply inspect my existing frontend codebase, identify every visual inconsistency and interaction defect, and fix the problems while preserving the project's existing design language, architecture, functionality, and reusable components.

**Do not perform a superficial review. Inspect the actual code, run the application, reproduce bugs, implement fixes, and verify the results.**

## Phase 1 — Inspect the Project and Available Skills

Before making changes:

1. Inspect the entire frontend project structure, package.json, framework, routing, styling system, component library, and existing design tokens.
2. Identify the current design language, including:
   - Color palette and semantic color tokens.
   - Typography, font weights, and line heights.
   - Spacing, padding, and margin conventions.
   - Border radius, shadows, borders, and elevation.
   - Buttons, forms, cards, dialogs, menus, and navigation.
   - Responsive breakpoints and animation conventions.
3. Check the agent's available skills, including any existing frontend-design, UI/UX design, accessibility, browser testing, and frontend debugging skills.
4. Select the most relevant and capable frontend-design skill available.
5. If a suitable skill is missing, find and install a trusted, compatible frontend-design skill using the agent's supported skill installation mechanism. Verify its source, compatibility, and installation instructions before installing.
6. Read the selected skill's instructions and follow its workflow throughout the audit.
7. Reuse existing dependencies and design components wherever possible. Do not install redundant libraries.

Do not claim that a skill has been installed unless installation has actually succeeded. If installation is unavailable, explain the limitation and proceed using established frontend engineering and UI/UX best practices.

## Phase 2 — Deep Visual Bug Audit

Inspect every page, route, layout, reusable component, and interactive state.

### A. Modal and Popup Audit

Check all dialogs, confirmation popups, drawers, tooltips, popovers, and overlays.

Identify and fix:
- Incorrect width, height, padding, margin, and internal spacing.
- Misaligned titles, descriptions, buttons, icons, and close controls.
- Content overflowing the viewport or dialog container.
- Incorrect vertical or horizontal positioning.
- Dialogs appearing behind headers, dropdowns, or other overlays.
- Incorrect z-index stacking and conflicting stacking contexts.
- Background scrolling while a modal should lock scrolling.
- Missing Escape-key behavior, outside-click behavior, or focus management where appropriate.
- Broken scrolling when dialog content exceeds the available height.
- Mobile dialogs that are too large, too small, or partially off-screen.
- Inconsistent backdrop opacity, shadows, borders, and corner radii.
- Layout shifts when dialogs open or close.

### B. Dropdown, Select, and Popover Audit

Inspect every dropdown and selection control, including native selects, custom selects, searchable dropdowns, autocomplete, date pickers, filter menus, and action menus.

Check:
- Incorrect positioning relative to the trigger.
- Menus appearing outside the viewport or being clipped by containers.
- Incorrect width, padding, row height, and item spacing.
- Inconsistent typography, icons, hover states, and selected states.
- Menus opening in the wrong direction.
- Broken keyboard navigation and focus states.
- Incorrect stacking order or menus hidden behind other components.
- Scrollbar appearance and long-list behavior.
- Dropdowns jumping when opened, scrolled, or when their contents change.
- Incorrect behavior on mobile and smaller screens.

Use the existing component library when possible. Replace defective implementations with appropriate reusable design-system components rather than creating unnecessary duplicate components.

### C. Spacing, Padding, and Alignment Audit

Inspect all pages for inconsistent layout spacing.

Check:
- Page-level padding and container widths.
- Section spacing and vertical rhythm.
- Card padding and grid gaps.
- Form field spacing and label alignment.
- Button dimensions and spacing between actions.
- Table cell padding and row heights.
- Header, sidebar, navigation, and footer alignment.
- Icon-to-text spacing.
- Inconsistent margins between similar components.
- Text wrapping, clipping, overflow, and unintended whitespace.
- Elements that become misaligned when content length changes.

Establish consistent spacing rules using the project's existing design tokens and styling conventions. Consolidate repeated values where appropriate instead of introducing arbitrary new values.

### D. Layout Jumping and Visual Stability

Treat layout instability as a high-priority defect.

Investigate:
- Content shifting when fonts load.
- Images and videos changing dimensions after loading.
- Buttons or cards changing size during hover or interaction.
- Dropdowns and modals shifting their position.
- Text wrapping differently after data loads.
- Loading states causing major layout changes.
- Skeleton loaders that do not match the final content dimensions.
- Conditional rendering that unexpectedly pushes content around.
- Scrollbar appearance or disappearance changing the layout width.
- React state updates causing unnecessary remounts.
- Unstable component keys and incorrect list rendering.
- CSS transitions that animate layout properties unintentionally.
- Animations that conflict with component state changes.
- Responsive breakpoint changes causing horizontal overflow or abrupt misalignment.
- Content jumping after navigation, filtering, sorting, or asynchronous requests.

Use appropriate techniques such as:
- Explicit image and media aspect ratios.
- Reserved space for asynchronous content.
- Stable component identity and keys.
- Consistent component dimensions.
- Appropriate font-loading strategies.
- Carefully chosen CSS transitions.
- Transform and opacity animations when appropriate.
- Correct loading, empty, error, and success states.

Do not hide genuine layout defects with arbitrary fixed heights or excessive absolute positioning.

### E. Forms and Interactive Components

Audit inputs, textareas, checkboxes, radio buttons, switches, tabs, buttons, pagination, toolbars, search fields, and filters.

Check:
- Inconsistent sizing and padding.
- Incorrect borders, focus rings, and disabled states.
- Missing hover, active, loading, error, and success states.
- Broken validation messages and error spacing.
- Labels overlapping inputs or placeholders.
- Buttons changing dimensions when loading.
- Incorrect cursor behavior and click targets.
- Duplicate submissions or broken state transitions.
- Keyboard accessibility and visible focus indicators.
- Components that look interactive but do not work.

Ensure all interactive controls remain functional after visual fixes.

## Phase 3 — Design System and Component Consistency

Create or improve a consistent component system that fits the existing project.

1. Reuse the project's established styling system and design tokens.
2. Standardize shared components such as buttons, inputs, selects, dialogs, dropdowns, tooltips, and cards.
3. Ensure equivalent components have consistent dimensions, spacing, typography, borders, and interaction states.
4. Replace duplicated or defective implementations with shared components when doing so is safe.
5. Preserve the current visual identity. Do not redesign the entire product unnecessarily.
6. Avoid introducing new colors, fonts, shadows, radii, or spacing values without a clear design reason.
7. Follow the existing framework and styling conventions rather than introducing a competing styling system.
8. Ensure component APIs remain compatible with existing usages, or update every affected usage when a change is necessary.

If the project already uses Tailwind CSS, prefer its utility classes and existing theme configuration instead of introducing raw CSS for ordinary component styling. Keep custom CSS only when it is genuinely necessary, such as complex animations or unsupported styling requirements.

## Phase 4 — Responsive and Cross-Viewport Testing

Test the application at representative viewport sizes, including:

- Small mobile: 320–375px.
- Standard mobile: 390–430px.
- Tablet: 768px.
- Laptop: 1024–1440px.
- Desktop: 1440px and above.

At each relevant size, verify:
- No unintended horizontal scrolling.
- No clipped text, buttons, dialogs, or dropdowns.
- Correct page padding and content widths.
- Consistent spacing and alignment.
- Functional mobile navigation and touch targets.
- Correct modal and dropdown positioning.
- Stable layouts during resizing and scrolling.
- No overlapping elements or broken grids.
- Usable forms, tables, and data-heavy interfaces.

Use the available browser automation or visual inspection tools to test the real application. Do not rely exclusively on reading the source code.

## Phase 5 — Automated and Manual Verification

After implementing fixes:

1. Run the project's available lint, type-check, build, and test commands.
2. Use browser tools to inspect console errors, failed requests, and runtime exceptions.
3. Navigate through every relevant route.
4. Exercise modal open/close behavior, dropdown interactions, form submission, filtering, and navigation.
5. Inspect loading, empty, error, success, and populated states.
6. Test scrolling, resizing, and repeated interactions to expose intermittent visual defects.
7. Compare screenshots before and after fixes where browser screenshot tools are available.
8. Check for regressions in unrelated components and pages.
9. Fix newly introduced errors before declaring the audit complete.

Do not claim that a browser test, build, or interaction passed unless it was actually executed.

## Phase 6 — Implementation Rules

- Audit first, then prioritize and fix defects systematically.
- Fix root causes instead of applying superficial visual patches.
- Preserve existing business logic, routes, API contracts, and working functionality.
- Avoid unnecessary rewrites and dependency installations.
- Do not create duplicate components when reusable alternatives already exist.
- Do not suppress errors to make the project appear healthy.
- Do not remove functionality simply to eliminate a visual defect.
- Keep changes focused, maintainable, and consistent with the existing architecture.
- Use the smallest safe change that fully resolves each defect.
- If a proposed change could break existing behavior, inspect all affected usages before applying it.

## Phase 7 — Final Audit Report

Provide a report containing:

1. **Project assessment:** framework, styling system, design system, and skill used.
2. **Skill installation:** exact skill name, source, and verified installation status.
3. **Issues discovered:** page or component, severity, root cause, and impact.
4. **Fixes implemented:** files changed and the reason for each change.
5. **Visual stability:** the layout-shift problems identified and how they were addressed.
6. **Responsive results:** which viewport sizes and pages were actually tested.
7. **Verification results:** build, lint, type-check, tests, browser checks, and any failures.
8. **Remaining issues:** defects that could not be resolved, with the reason.
9. **Recommended next steps:** only high-value improvements that remain necessary.

### Definition of Done

The task is complete only when the relevant frontend has been inspected, high-priority visual defects have been fixed, interactive components have been tested, responsive behavior has been verified, and all results have been reported honestly.

**Start by inspecting the project and available skills. Do not begin by blindly changing styles or rebuilding existing components.**