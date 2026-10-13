# Task: Design-Aware UI Audit, 21st.dev Component Integration & Design System Consistency

## Objective

Build on the existing project plan. Do not start over or rebuild the application unnecessarily.

I want you to deeply understand the current website's design language, inspect the entire frontend, identify raw or unstyled HTML elements and components, and selectively replace suitable elements with components from **21st.dev**.

The most important requirement is that every integrated component must be redesigned to match our existing design system. Do not blindly copy components from 21st.dev or introduce an unrelated visual style.

You are responsible for making the existing frontend more consistent, polished, maintainable, responsive, and production-ready.

## Phase 1 — Understand the Existing Design Language

Before editing any code, inspect the existing frontend thoroughly.

Analyze:

- Overall visual identity and design direction.
- Existing color palette, CSS variables, Tailwind theme tokens, and semantic colors.
- Typography, font families, font weights, sizes, line heights, and letter spacing.
- Layout grids, content widths, spacing, margins, and padding.
- Buttons, links, inputs, cards, badges, dropdowns, dialogs, and navigation.
- Border styles, radii, shadows, backgrounds, and visual hierarchy.
- Responsive behavior across desktop, tablet, and mobile.
- Existing animations, hover effects, transitions, scrolling behavior, and interaction patterns.
- Shared components, layout structures, and reusable utilities.

Inspect the actual implementation, not just screenshots.

Identify the project's established design language and document its rules before making visual changes.

**Important:** Treat the current design system as the source of truth. Preserve the existing brand identity, page structure, content, and successful design decisions.

Do not introduce a new color palette, typography system, or unrelated visual direction.

## Phase 2 — Audit Raw HTML and Unstyled Elements

Scan all relevant frontend pages, layouts, components, and interactive states.

Identify elements that are:

- Plain HTML elements without appropriate styling.
- Visually inconsistent with the rest of the website.
- Missing proper spacing, typography, states, or responsive behavior.
- Repeated implementations that should use a shared component.
- Placeholder UI or unfinished components.
- Using unnecessary inline styles or raw CSS instead of the established Tailwind CSS system.
- Functionally correct but visually disconnected from the current design language.

Examples include unstyled buttons, inputs, tables, dropdowns, tooltips, empty states, alerts, navigation items, and content cards.

Do not assume every HTML element needs to be replaced. Semantic HTML is still essential.

For each candidate, determine whether it should be:

1. Improved using existing project components.
2. Refactored into a reusable component.
3. Replaced with a suitable 21st.dev component.
4. Left unchanged because the existing implementation is already appropriate.

Prioritize actual UI problems instead of making unnecessary changes just to use more components.

## Phase 3 — Discover and Select 21st.dev Components

Use https://21st.dev/ to find suitable components when they provide a meaningful improvement.

Search for components that match the actual UI requirement, such as:

- Buttons and interactive controls.
- Navigation and menus.
- Cards and content presentation.
- Forms and input patterns.
- Dialogs, popovers, and tooltips.
- Tabs, accordions, and filters.
- Empty states and feedback elements.
- Other components that solve an identified UI problem.

Before integrating a component, evaluate its structure, dependencies, accessibility, responsiveness, animation behavior, and styling approach.

Do not install a library or component just because it looks attractive in isolation.

Prefer components that work with the project's existing Next.js architecture, Tailwind CSS version, and installed dependencies.

If browsing 21st.dev is unavailable, report that limitation and continue improving existing components. Do not pretend that you retrieved or integrated a component you could not access.

## Phase 4 — Redesign Every Imported Component

This is a mandatory step.

A component copied from 21st.dev is a starting point, not a finished implementation.

Before integrating it into the application:

1. Remove conflicting default styling.
2. Map its colors to existing design tokens.
3. Match the established typography.
4. Match the project's spacing, dimensions, borders, and radii.
5. Adjust its layout and visual hierarchy.
6. Match existing button and interaction conventions.
7. Implement appropriate hover, focus, active, disabled, loading, and error states where relevant.
8. Make it responsive across supported screen sizes.
9. Verify that animations fit the existing motion style.
10. Ensure the component looks as if it was originally designed for this website.

Do not preserve an imported component's original colors, gradients, shadows, fonts, radii, or animations when they conflict with our current design language.

Avoid unnecessary gradients, excessive glassmorphism, oversized rounded corners, decorative effects, and flashy animations unless they are already part of the established design direction.

**Acceptance criterion:** A user should not be able to tell that a component came from a different design system.

## Phase 5 — Tailwind CSS and Styling Rules

This project uses Next.js and is frontend-only.

- Use the existing Tailwind CSS setup as the primary styling system.
- Reuse existing theme tokens, utilities, and shared components.
- If using Tailwind CSS v4, follow the project's existing v4 configuration and `@theme` conventions.
- Do not introduce a second styling framework.
- Do not use inline styles for ordinary visual styling.
- Do not create new raw CSS files for styling that Tailwind can handle.
- Do not use arbitrary values when an existing design token or standard utility is appropriate.
- Keep CSS for cases where it is genuinely needed, such as complex keyframes, third-party integration requirements, or features that Tailwind cannot reasonably express.
- Avoid duplicating CSS rules or creating competing design tokens.
- Preserve existing global styles and configuration unless a verified problem requires a change.

If a 21st.dev component requires custom CSS, first determine whether its styling can be implemented cleanly with Tailwind. Keep any necessary exception scoped and documented.

## Phase 6 — GSAP and Animation Consistency

Use GSAP for complex animations and scroll-driven effects where appropriate, following the existing project plan.

- Reuse existing animation utilities and conventions.
- Do not add animations to every component unnecessarily.
- Avoid layout shifts, text jumping, flickering, and scroll instability.
- Respect `prefers-reduced-motion`.
- Clean up GSAP timelines, ScrollTriggers, and event listeners when components unmount.
- Avoid conflicting GSAP and CSS animations on the same properties.
- Keep interactions responsive and performant.
- Use animation to improve clarity and visual storytelling, not to distract users.

If an imported 21st.dev component includes Framer Motion or another animation library, assess whether it is necessary before introducing another dependency. Prefer the project's established animation approach when practical.

## Phase 7 — Component Architecture and Code Quality

Inspect the existing component architecture before refactoring.

- Reuse existing components and utilities where possible.
- Create shared components when repeated patterns genuinely exist.
- Keep component responsibilities clear.
- Avoid duplicating the same UI pattern across multiple pages.
- Preserve existing props, interactions, routes, and behavior unless an intentional change is required.
- Follow Next.js Server and Client Component conventions.
- Add `"use client"` only where client-side interaction or browser APIs require it.
- Avoid unnecessary dependencies and oversized client bundles.
- Remove unused imports, dead components, obsolete styles, and genuinely unused files after verifying they are not referenced.
- Preserve configuration, assets, routes, and files required by the build.

Do not perform destructive cleanup based solely on filenames or assumptions.

## Phase 8 — Functional and Responsive QA

After implementing changes, inspect the actual application.

Test:

- Desktop, tablet, and mobile layouts.
- Navigation, links, buttons, and form submissions.
- Dropdowns, dialogs, tabs, filters, and other interactive components.
- Hover, focus, active, disabled, and error states.
- Long text, empty data, and overflow scenarios.
- Keyboard navigation and accessibility.
- Scrolling, sticky elements, and animated sections.
- Layout shifts and inconsistent component dimensions.
- Browser console errors and failed network requests relevant to the frontend.
- Next.js build, lint, and type-check commands where configured.

Check that integrated components do not introduce hydration errors, missing dependencies, broken imports, or unnecessary client-side rendering.

Fix confirmed issues instead of merely reporting them.

Do not claim that a test passed unless you actually ran it.

## Phase 9 — Implementation Workflow

Work in this order:

1. Inspect the codebase and current design system.
2. Produce a concise design-language summary.
3. Audit pages and identify raw, unstyled, inconsistent, or duplicated UI.
4. Prioritize issues by visual impact, usability, reuse, and implementation risk.
5. Map each candidate to an existing component, a refactor, or a suitable 21st.dev component.
6. Integrate and restyle components incrementally.
7. Replace duplicated patterns with shared components where appropriate.
8. Run functional, responsive, and visual regression checks.
9. Fix errors introduced by the changes.
10. Report the completed work and remaining limitations.

Avoid changing the entire website in one uncontrolled refactor. Make small, coherent changes and validate them as you go.

## Final Acceptance Criteria

The task is complete only when:

- The existing design language has been understood and preserved.
- Relevant raw or unstyled UI elements have been addressed.
- 21st.dev components have been used selectively where they add value.
- Every imported component matches the existing design system.
- Tailwind CSS remains the primary styling approach.
- GSAP animations are consistent, stable, and properly cleaned up.
- Shared components are reused instead of duplicated.
- Existing functionality and content are preserved.
- Responsive layouts and accessibility have been checked.
- No new build errors or console errors have been left unresolved.
- Unused files have been removed only after verifying they are safe to delete.

## Final Report

Provide:

1. **Design Language:** A summary of the existing visual rules you identified.
2. **UI Audit:** The unstyled, inconsistent, or duplicated elements found.
3. **21st.dev Integrations:** The components selected, their source links, and why each was chosen.
4. **Design Adaptations:** How each imported component was adapted to match the current website.
5. **Code Cleanup:** Components, styles, and files refactored or removed.
6. **QA Results:** Tests actually performed and their results.
7. **Remaining Issues:** Anything blocked, unverified, or requiring further work.

Be selective, preserve what already works, and prioritize a consistent, high-quality product over the number of components replaced.