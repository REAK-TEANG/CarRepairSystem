# EXHAUSTIVE FRONTEND AUDIT — 21st.dev MIGRATION, DESIGN SYSTEM REBUILD, UI/UX VERIFICATION & CODE QUALITY

## Mission

Act as a principal frontend engineer, UI/UX auditor, design-system architect, accessibility specialist, and code quality reviewer.

Perform an exhaustive audit of the entire existing frontend codebase. Inspect every relevant directory, page, component, layout, form, interaction, styling implementation, and dependency.

My objective is to eliminate inconsistent, duplicated, and poorly implemented UI patterns; integrate suitable components from 21st.dev; redesign those components to match the existing product's design language; and verify that the entire frontend remains visually consistent, responsive, accessible, and functional.

**This is a deep inspection and improvement task, not a quick cleanup.**

Do not stop after inspecting the homepage, shared components, or a handful of files. Do not assume that the absence of obvious errors means the frontend is healthy.

---

## PHASE 1 — BUILD A COMPLETE CODEBASE INVENTORY

Before changing code, map the entire frontend.

Inspect:

- Application entry points and framework configuration.
- All routes, pages, nested layouts, and route-specific components.
- Shared components, feature components, and reusable UI primitives.
- Forms, input fields, textareas, selects, dropdowns, filters, and search interfaces.
- Buttons, links, menus, dialogs, modals, popovers, tooltips, and notifications.
- Tables, pagination, tabs, accordions, cards, and data-display components.
- Loading indicators, skeletons, empty states, error states, and confirmation states.
- Authentication screens, dashboards, settings pages, admin interfaces, and secondary routes.
- CSS, SCSS, Tailwind classes, theme variables, global styles, and component-specific styles.
- Icons, fonts, animations, responsive utilities, and visual assets.
- Dependencies, package scripts, component libraries, and copied 21st.dev components.
- API integrations, state management, form libraries, and event handlers.

Inspect the complete file structure before deciding what is relevant.

Create a coverage inventory containing every discovered page, component directory, and relevant configuration file. Mark each item as inspected, modified, verified, intentionally excluded, or blocked.

Do not mark an item as inspected merely because its filename appeared in a directory listing.

## PHASE 2 — PERFORM MULTIPLE INDEPENDENT AUDIT PASSES

Perform separate passes so that one type of issue does not hide another.

### Pass A: Native HTML and component consistency

Search the entire source code for native interactive elements, including:

- input
- textarea
- select and option
- button
- checkbox and radio implementations
- switch and toggle implementations
- date and time controls
- manually implemented dropdowns and autocomplete fields
- native dialogs and custom popovers
- duplicated form controls and repeated interaction patterns

Inspect actual JSX/TSX markup, not just filenames or search summaries.

For each occurrence, determine whether it should:
1. Use an existing shared component.
2. Use an appropriate 21st.dev component.
3. Be wrapped in a new reusable component.
4. Remain native because that is the correct semantic or technical choice.

Do not automatically replace every HTML tag. Semantic elements such as div, section, main, form, label, and span are legitimate.

The objective is to eliminate inconsistent interactive UI implementations, not to eliminate semantic HTML.

### Pass B: 21st.dev integration audit

Inspect every existing 21st.dev component and every suitable component that could be adopted.

For each component, verify:

- Its source implementation and dependencies.
- Whether it duplicates an existing project component.
- Whether it uses incompatible styling conventions.
- Whether its API supports current application requirements.
- Whether its keyboard interactions and accessibility are correct.
- Whether its default styles conflict with the current design system.
- Whether it introduces unnecessary packages, animations, or complexity.
- Whether it is correctly integrated into actual application pages.

Do not merely install components. Integrate, adapt, and verify them.

### Pass C: Design language and visual consistency

Identify the actual design system from the existing application.

Audit every relevant UI pattern for:

- Color tokens and inconsistent hardcoded colors.
- Typography, font sizes, weights, and line heights.
- Spacing, alignment, padding, and margins.
- Input, button, and control heights.
- Border thickness, radius, shadows, and surface colors.
- Icon sizing, positioning, and visual weight.
- Hover, focus, active, selected, disabled, and loading states.
- Validation messages, destructive actions, and confirmation feedback.
- Consistency between pages, sections, and component variants.

Create a list of deviations from the established design language.

Do not invent a new design system or impose 21st.dev's default aesthetic on the product.

### Pass D: Functional behavior

Inspect whether components actually work, including:

- Form submission and validation.
- Controlled and uncontrolled inputs.
- Search, filtering, sorting, pagination, and selection.
- Dropdown opening, selection, dismissal, and keyboard navigation.
- Modal focus handling and close behavior.
- Disabled and loading states.
- API request handling and error feedback.
- State synchronization and component lifecycle behavior.
- Event handlers, prop forwarding, and ref forwarding.
- Route navigation and browser history.
- Duplicate submissions, stale state, and race conditions.

Check for interactions that look functional but do nothing, handlers that are disconnected, and components with incomplete state management.

Do not change backend contracts or replace real application data with mock data.

### Pass E: Responsive layout and visual stability

Check every accessible page at representative mobile, tablet, laptop, and desktop viewport sizes.

Inspect:

- Horizontal overflow and clipped content.
- Incorrect stacking, alignment, and spacing.
- Text wrapping and unexpected layout shifts.
- Dropdowns or popovers clipped by containers.
- Dialogs exceeding viewport boundaries.
- Tables and forms breaking at narrow widths.
- Overlapping fixed or sticky elements.
- Incorrect z-index and stacking contexts.
- Touch target usability.
- Font loading and content movement.
- Animation-induced layout shifts.
- Responsive navigation and sidebar behavior.

Fix the underlying component or layout rules instead of accumulating one-off CSS patches.

### Pass F: Code quality and architecture

Search for:

- Duplicate components and duplicated business logic.
- Unused imports, exports, functions, and dependencies.
- Dead files and obsolete components.
- Broken or circular imports.
- Inconsistent component APIs.
- Excessive prop drilling and unnecessary state duplication.
- Incorrect React keys and unstable rendering patterns.
- Missing cleanup in effects and event subscriptions.
- Unnecessary rerenders and expensive rendering operations.
- Conflicting CSS and redundant Tailwind classes.
- Hardcoded values that bypass established design tokens.
- Type errors, lint errors, console warnings, and hydration issues where applicable.

Verify actual references and runtime usage before removing code.

Do not delete a component simply because it has no direct import; it may be referenced through dynamic imports, route configuration, registries, or framework conventions.

---

## PHASE 3 — CREATE AN EVIDENCE-BASED ISSUE REGISTER

Before large-scale modifications, record each significant issue.

For every finding, include:

- Unique issue ID.
- Severity: Critical, High, Medium, or Low.
- Exact file path and component name.
- The observed implementation or behavior.
- Why it is a problem.
- The recommended solution.
- Dependencies and potential regression risks.
- Whether the issue was verified or remains a hypothesis.

Prioritize issues that affect multiple pages, shared components, accessibility, security, functional correctness, and visual consistency.

Do not report speculative problems as confirmed defects.

---

## PHASE 4 — ESTABLISH A SHARED COMPONENT FOUNDATION

Inspect the existing component architecture before creating new abstractions.

Establish or improve shared components for appropriate patterns, including:

- Button and button variants.
- Input and Textarea.
- Select and searchable select.
- Checkbox, RadioGroup, and Switch.
- FormField and validation feedback.
- Dialog and confirmation dialog.
- DropdownMenu, Popover, and Tooltip.
- DatePicker and other specialized controls where needed.

Use 21st.dev components when they offer a suitable implementation. Adapt their source, API, accessibility, and styling to the project.

If a component already exists and is suitable, improve it instead of introducing a duplicate.

Centralize design tokens and shared variants where appropriate. Maintain the project's existing styling approach and avoid introducing unnecessary libraries.

Ensure reusable components support required attributes, controlled state, validation, refs, accessibility, and existing application behavior.

---

## PHASE 5 — MIGRATE THE ENTIRE FRONTEND

Migrate the appropriate UI patterns across every affected page, not only the shared component demonstration or one example form.

For every migration:

1. Identify all usages of the old implementation.
2. Check each usage for unique requirements.
3. Select or adapt the appropriate shared component.
4. Preserve the existing functionality and API contracts.
5. Apply consistent styling and interaction behavior.
6. Update imports and types.
7. Remove the old implementation only when it is genuinely unused.
8. Test the modified component and its actual page usage.
9. Search again for remaining inconsistent implementations.

Do not replace a native control with a visually attractive component that breaks form submission, keyboard navigation, validation, or state management.

Do not force every control into one component when different behaviors require different implementations.

---

## PHASE 6 — DEEP TESTING AND VERIFICATION

Use the available tools and existing project scripts to test the application.

### Static verification
- Search for remaining native interactive UI patterns.
- Search for duplicate component implementations.
- Inspect unused imports and dead references.
- Run available linting and type-checking tools.
- Run production builds and existing automated tests.
- Inspect dependency changes and lockfile consistency.

### Runtime verification
- Launch the application when the environment permits.
- Visit every accessible route in the inventory.
- Inspect browser console errors and failed network requests.
- Exercise representative controls and forms.
- Verify dropdowns, dialogs, menus, validation, and keyboard behavior.
- Test loading, empty, error, disabled, and success states.
- Inspect responsive layouts and overflow.
- Verify that existing API integrations continue working.

### Regression verification
- Compare behavior before and after migration.
- Confirm that existing features still work.
- Verify that shared component changes have not broken other pages.
- Check that styling changes do not leak into unrelated components.
- Confirm that no data operations or permissions were unintentionally altered.

Do not claim a page or feature passed testing unless it was actually tested. Clearly report anything blocked by missing credentials, infrastructure, or tooling.

---

## PHASE 7 — REPEAT THE AUDIT AFTER IMPLEMENTATION

This phase is mandatory.

After completing the initial modifications, repeat the original audit against the resulting codebase.

1. Re-enumerate the source files and relevant routes.
2. Re-run searches for native interactive elements.
3. Recheck all existing and newly integrated 21st.dev components.
4. Search for duplicate components and obsolete code.
5. Inspect all modified files for unintended changes.
6. Re-run the available lint, type-check, build, and test commands.
7. Revisit affected pages and test shared components across different contexts.
8. Confirm that every issue marked as fixed has supporting verification.
9. Update the inventory with the final status of every item.
10. Record unresolved findings instead of silently ignoring them.

A successful build is not proof of a complete UI audit.

A clean search result is not proof of correct runtime behavior.

Do not declare completion while significant discovered issues remain unaddressed or undocumented.

---

## EXECUTION RULES

- Inspect first and modify second.
- Work incrementally and verify each stage.
- Reuse the existing architecture and design language.
- Avoid unnecessary rewrites and dependencies.
- Preserve existing functionality, routes, state, and API contracts.
- Do not hide errors by suppressing warnings or disabling checks.
- Do not claim exhaustive coverage without an inventory and verification evidence.
- If the project is too large for one pass, divide it into explicit batches and track progress until all relevant areas are covered.
- If a change is risky or destructive, explain the risk before proceeding.
- Do not stop after producing a plan when implementation is safe and authorized.

## FINAL DELIVERABLES

Provide:

1. Complete frontend inventory and coverage status.
2. Issue register with severity, evidence, and resolution status.
3. Summary of native UI patterns identified, migrated, and intentionally retained.
4. Inventory of integrated and redesigned 21st.dev components.
5. Exact list of files created, modified, and removed.
6. Design-system inconsistencies fixed.
7. Functional, responsive, and accessibility findings.
8. Dead code and dependency cleanup results.
9. Commands executed and actual test results.
10. Before-and-after performance or build measurements where available.
11. Remaining issues, blockers, and unverified areas.
12. Final second-pass audit results.

## DEFINITION OF DONE

The task is complete only when every relevant area in the discovered inventory has a recorded status, appropriate native interactive UI patterns have been migrated or justified, adopted components match the existing design language, affected functionality has been verified, and the final audit has been repeated.

**Your objective is not to produce the smallest diff or the fastest superficial fix. Your objective is to achieve a thoroughly inspected, consistent, maintainable, and verified frontend without damaging the existing product.**