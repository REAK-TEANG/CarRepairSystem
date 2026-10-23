# Frontend Codebase Audit, Refactoring & Component Reusability

## Objective

Perform a complete audit of the entire frontend codebase. Simplify, clean, and refactor the code while preserving all existing functionality, UI/UX, business logic, and responsive behavior.

The goal is to make the codebase cleaner, shorter, more maintainable, and more reusable—not to rewrite everything unnecessarily.

## 1. Deep Codebase Audit

Inspect the entire frontend project before making changes.

- Understand the existing architecture, framework, routing, state management, and design system.
- Identify duplicated code, repeated UI patterns, oversized components, unnecessary complexity, and inconsistent implementations.
- Find unused components, dead code, unused imports, duplicate utilities, and obsolete files.
- Identify components that contain too many responsibilities and could be split into smaller, reusable components.
- Check for potential bugs, broken interactions, console errors, and accessibility issues.
- Trace component dependencies before modifying or deleting files.

Do not start refactoring until you understand how the existing code works.

## 2. Identify and Extract Reusable UI Components

Search the entire frontend for UI elements that look or behave similarly.

Examples include:

- Buttons and button variants
- Input fields, selects, textareas, and date pickers
- Form fields, labels, validation messages, and form layouts
- Cards, statistic cards, and KPI components
- Tables, table headers, pagination, and empty states
- Modals, dialogs, confirmation dialogs, and drawers
- Dropdown menus and action menus
- Search bars and filter controls
- Badges, status indicators, and tags
- Page headers, section headers, and breadcrumbs
- Loading states, skeletons, and error states
- Repeated layout structures and responsive containers

For each repeated pattern:

1. Compare its appearance, behavior, props, and dependencies.
2. Determine whether the implementations are genuinely similar.
3. Extract a shared component when doing so improves maintainability.
4. Replace duplicated implementations with the shared component.
5. Support necessary differences through clear props, variants, or composition.
6. Preserve the existing visual design, functionality, accessibility, and responsive behavior.

**Important:** Do not create a new component for every small element. Reuse components when the abstraction is meaningful. Avoid excessive props, deeply nested wrappers, and unnecessary abstraction.

## 3. Simplify and Refactor Code

Make the code shorter and easier to understand without sacrificing quality.

- Remove repeated logic by extracting reusable functions and hooks where appropriate.
- Simplify complex conditional rendering and repetitive JSX.
- Consolidate duplicate constants, formatting functions, validation rules, and utilities.
- Reduce oversized components by separating logically independent responsibilities.
- Keep state management straightforward and predictable.
- Remove unnecessary wrappers, redundant effects, and duplicated state.
- Use existing project libraries and components when they already solve the problem.
- Follow the conventions and architecture already established in the project.

Do not compress code just to reduce line count. Readability, correctness, and maintainability are more important than having fewer lines.

## 4. Preserve Existing Functionality

This is a refactoring task, not a redesign.

Do not unintentionally change:

- Business logic or calculations
- API endpoints, request payloads, or response handling
- Authentication, authorization, or routing
- Form validation and submission behavior
- State updates and data synchronization
- Permissions and role-based UI
- Existing UI content and design language
- Responsive layouts, interactions, animations, and keyboard behavior

Do not replace real API data with mock data. Do not remove functionality simply because it appears unused; verify its references and runtime usage first.

## 5. Maintain a Consistent Design System

Create or improve shared design tokens and component variants where appropriate.

- Reuse consistent spacing, typography, colors, borders, radii, and shadows.
- Ensure buttons, inputs, cards, tables, modals, and other shared elements behave consistently.
- Preserve the current design language rather than introducing a new one.
- Avoid duplicated styling and conflicting CSS.
- Use the project's existing styling approach and component library where possible.

If two components look similar but have different functional requirements, share their common structure while preserving their differences.

## 6. Testing and Regression Prevention

After each meaningful refactoring:

- Run the available linting, type-checking, build, and test commands.
- Fix errors introduced by the changes.
- Verify imports, exports, component props, routes, and dependencies.
- Test important user workflows, form submissions, dialogs, dropdowns, tables, and navigation.
- Check responsive layouts and interactive states.
- Review browser console errors and network failures where browser testing is available.
- Compare the UI before and after refactoring to detect unintended visual changes.

Do not claim that functionality is preserved unless the relevant checks have actually been performed.

If a test fails, determine whether the failure existed before the refactoring or was introduced by the changes.

## 7. Safe File Cleanup

Before deleting any file:

1. Search for all imports and references.
2. Check route registration, lazy loading, dynamic imports, and runtime usage.
3. Check whether the file is referenced by configuration, styles, assets, or build scripts.
4. Remove it only when it is confirmed to be unnecessary.
5. Run the relevant checks after deletion.

Never delete files simply because they appear unused from a single search result.

## 8. Required Workflow

Follow this sequence:

**Phase 1 — Audit**

- Inspect the project structure and frontend architecture.
- Identify duplicated UI, repeated logic, oversized components, and dead code.
- Produce a concise refactoring plan.

**Phase 2 — Component Mapping**

- Create a list of existing components and repeated UI patterns.
- Identify which components can be reused, consolidated, or split.
- Identify the appropriate shared component locations and interfaces.

**Phase 3 — Incremental Refactoring**

- Refactor in small, logically grouped changes.
- Extract shared components and update their consumers.
- Simplify duplicated logic.
- Remove verified dead code.
- Preserve existing behavior after each change.

**Phase 4 — Verification**

- Run available tests, linting, type checks, and production builds.
- Test important user workflows and compare the UI.
- Resolve regressions before continuing.

**Phase 5 — Final Review**

- Review the entire frontend for remaining duplication and inconsistencies.
- Verify that shared components are actually being reused.
- Confirm that no unnecessary abstractions or files were introduced.

## 9. Final Report

When finished, provide a concise report containing:

- Files inspected and files modified.
- Duplicate UI patterns identified.
- Shared components created or consolidated.
- Dead code and files safely removed.
- Major simplifications made.
- Tests, linting, type checks, and builds executed, with actual results.
- Any unresolved issues or unverified workflows.
- Remaining opportunities for improvement.

## Final Rules

- Inspect before editing.
- Refactor incrementally instead of rewriting everything.
- Reuse existing components before creating new ones.
- Preserve business logic, API contracts, UI/UX, and responsive behavior.
- Never sacrifice readability for fewer lines of code.
- Never silently remove functionality.
- Do not hide errors or disable tests to make the project appear healthy.
- Do not stop after producing an audit report; proceed with safe, verified refactoring.
- If a change has a significant risk of breaking functionality, explain the risk and investigate a safer approach first.

**Success criteria:** A cleaner and more maintainable frontend with less duplication, meaningful reusable components, consistent UI patterns, and no known regressions introduced by the refactoring.
