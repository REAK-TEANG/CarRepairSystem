# Task: Deep Codebase Cleanup, Dead Code Removal & Refactoring

Act as a **senior frontend engineer and codebase auditor**. Perform a comprehensive cleanup of my existing Next.js frontend project. The goal is to eliminate unnecessary code, remove unused files, simplify messy implementations, and improve maintainability without changing the current design, user experience, or working functionality.

## 1. Deep Codebase Audit

Before making changes, inspect the entire project, including:

- Project structure and folder organization.
- All pages, layouts, components, hooks, utilities, and libraries.
- Imports, exports, dependencies, and package configuration.
- Routing, middleware, and Next.js conventions.
- Tailwind CSS usage and global styling.
- Animation implementations and event listeners.
- API integrations, data fetching, and state management.
- Existing errors, warnings, duplicated logic, and technical debt.

Understand how the application works and how its components depend on one another before removing anything.

## 2. Remove Dead Code and Unused Files

Identify and safely remove:

- Unused components, pages, hooks, utilities, and helper functions.
- Files that are no longer imported or referenced.
- Zombie files left behind by previous implementations or redesigns.
- Unused CSS classes, obsolete stylesheets, and redundant styling rules.
- Dead code, unreachable branches, and commented-out legacy implementations.
- Unused variables, imports, constants, and function parameters.
- Duplicate components and unnecessary copies of the same logic.
- Unused images, icons, assets, and outdated design resources.
- Abandoned experiments, temporary files, and obsolete implementations.
- Dependencies that are genuinely unused.

**Important:** A file is not automatically safe to delete just because it has no direct imports. Check for dynamic imports, Next.js file conventions, route discovery, configuration references, scripts, asset paths, and other indirect usage before removing it.

## 3. Refactor Messy and Duplicated Code

Improve code quality by:

- Removing unnecessary complexity and redundant logic.
- Consolidating duplicated components and functions where appropriate.
- Reusing existing components, hooks, and utilities instead of creating new ones unnecessarily.
- Breaking down oversized components when doing so improves readability and maintainability.
- Improving naming consistency and file organization.
- Simplifying deeply nested conditionals and unnecessarily complicated expressions.
- Fixing incorrect dependencies in React hooks and unnecessary re-renders.
- Cleaning up event listeners, subscriptions, and other resources properly.
- Removing temporary workarounds when a safer, maintainable solution exists.
- Following current Next.js, React, TypeScript, and project-specific conventions.

Do not refactor code merely to make it look different. Every change should provide a clear benefit.

## 4. Preserve the Existing Design and Functionality

This is a frontend cleanup, not a redesign.

- Preserve the existing UI, design language, colors, typography, spacing, and responsive layouts.
- Do not change page content, routes, navigation, or user flows unnecessarily.
- Do not replace working implementations with mock data.
- Do not remove features simply because they appear rarely used.
- Preserve existing integrations and required environment variables.
- Avoid introducing new dependencies unless genuinely necessary.
- Reuse the existing project architecture and installed libraries whenever possible.

If an implementation is broken, document the issue and fix it only when the correction is safe and within scope.

## 5. Enforce the Existing Styling Architecture

Inspect the current styling system and follow the project's established conventions.

- Use Tailwind CSS for styling when it is already the project's standard.
- Remove obsolete or duplicated CSS only after confirming that it is no longer needed.
- Avoid introducing new raw CSS files or inline styling when an existing Tailwind-based solution is appropriate.
- Preserve global styles, theme tokens, font definitions, and required third-party styles.
- Keep responsive behavior and existing animations intact.

Do not migrate the entire styling architecture as part of cleanup unless explicitly required.

## 6. Validate Every Change

After each meaningful batch of changes:

1. Run the available lint checks.
2. Run TypeScript checks if the project uses TypeScript.
3. Run the production build.
4. Check for broken imports, missing modules, invalid routes, and unresolved references.
5. Verify that critical pages and components still work.
6. Check browser console errors and hydration issues when browser testing is available.
7. Inspect responsive layouts and confirm that cleanup has not introduced visual regressions.

Fix errors caused by your changes before proceeding. Do not claim that validation passed unless you actually ran the relevant checks.

## 7. Protect Existing Work

- Inspect Git status and existing user changes before editing.
- Never overwrite unrelated work or discard uncommitted changes.
- Avoid destructive bulk deletion based solely on automated tool output.
- Review suspicious files individually before removal.
- Keep changes incremental and easy to review.
- If a file's purpose or dependencies are uncertain, investigate further rather than deleting it.

## 8. Final Report

When the cleanup is complete, provide a concise report containing:

- **Files removed:** Paths and reasons for removal.
- **Files modified:** Paths and improvements made.
- **Code refactored:** Duplicated logic, messy implementations, and unnecessary complexity eliminated.
- **Dependencies removed:** Packages confirmed to be unused.
- **Issues fixed:** Errors and technical debt addressed.
- **Validation results:** Actual lint, type-check, build, and browser-test results.
- **Remaining issues:** Anything that could not be safely resolved.
- **Potential risks:** Changes requiring manual verification.

Include a summary of the cleanup's impact and identify any high-priority technical debt that remains.

## Execution Rules

Do not stop after producing an audit report. **Inspect, plan, implement, validate, and report.**

Work directly in the existing project. Do not generate a separate replacement application, duplicate the project, or rebuild functioning features from scratch.

Prioritize correctness, maintainability, minimal disruption, and preservation of existing functionality over the number of files deleted.

**Definition of done:** The codebase is cleaner, unnecessary files and code are safely removed, duplicated logic is reduced, the existing application remains functional, and all reported validation results are truthful.
