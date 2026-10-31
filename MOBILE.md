# Mobile-First Responsive UI/UX Audit, Design System & Playwright Testing

## 1. Role and Objective

Act as a **Senior Frontend Engineer, Responsive UI/UX Designer, Design Systems Architect, and QA Automation Engineer**.

Your mission is to audit, plan, improve, implement, and verify the mobile experience across the entire existing website or application.

Do not simply shrink the desktop layout to fit a phone. Create a responsive experience that feels intentionally designed for mobile devices while preserving the existing brand identity, design language, functionality, and user workflows.

Use the existing codebase as the source of truth. Understand the project before making changes.

### Primary objectives
- Establish consistent mobile typography, button sizes, spacing, layout rules, and responsive breakpoints.
- Inspect every page and important UI state using Playwright MCP.
- Identify real mobile usability problems through browser testing rather than assumptions.
- Create a prioritized improvement plan before implementation.
- Fix layout problems, overflow, text wrapping, touch targets, navigation, forms, tables, dialogs, and responsive components.
- Reuse existing components and design tokens wherever possible.
- Verify every meaningful fix with Playwright.
- Maintain functionality, accessibility, performance, and code quality.

Do not stop after producing an audit report. Continue through implementation and verification unless blocked by a genuine dependency or a decision requiring my approval.

---

## 2. Phase One: Understand the Existing Project

Before changing any code:

1. Inspect the project structure, package.json, framework, routing, styling system, UI libraries, and existing design tokens.
2. Identify all routes, pages, layouts, shared components, navigation systems, forms, modals, dropdowns, tables, dashboards, and interactive elements.
3. Determine how authentication, protected routes, loading states, error states, and empty states work.
4. Identify existing responsive utilities, breakpoints, typography scales, spacing conventions, and component variants.
5. Inspect the current implementation for duplicated styles, inconsistent component sizes, conflicting CSS, fixed-width elements, and unnecessary overrides.
6. Confirm that Playwright MCP is available and determine how to use the existing browser session and development server.
7. Identify the correct commands to run the application and its existing tests.

Do not replace the current architecture, UI library, or styling system without a clear technical reason.

If the project uses Tailwind CSS, prefer existing Tailwind utilities and theme tokens. Avoid introducing unnecessary raw CSS, new dependencies, or duplicate styling systems.

If the project uses another styling approach, follow its existing conventions unless a migration is explicitly justified.

Do not delete files or components merely because they appear unused. Verify their references and purpose first.

---

## 3. Phase Two: Establish Mobile Design Standards

Create a consistent responsive design system based on the existing brand and actual content.

Use the following values as initial recommendations, not rigid rules. Adjust them when the product, typography, content, or accessibility requirements justify a different value.

### A. Responsive breakpoints

Use the project's existing breakpoints where practical. Otherwise, start with:

| Breakpoint | Target | Design behavior |
|---|---|---|
| Below 360px | Very small phones | Compact layout, no horizontal overflow |
| 360–479px | Standard phones | Single-column content and mobile navigation |
| 480–767px | Large phones | Flexible content and optional two-column sections |
| 768–1023px | Tablets | Adaptive grids and tablet navigation |
| 1024–1279px | Small desktop | Desktop layouts with appropriate compression |
| 1280px and above | Desktop | Full desktop experience |

Do not rely only on named device breakpoints. Let the content determine when a layout needs to change.

Test at 320px, 360px, 375px, 390px, 414px, and 430px viewport widths where applicable, plus tablet and desktop sizes.

### B. Mobile typography scale

Use these as starting values for mobile screens:

| Element | Font size | Weight | Guidance |
|---|---:|---:|---|
| Hero heading | 32–40px | 600–700 | Responsive, balanced line breaks |
| H1 | 28–32px | 600–700 | Main page heading |
| H2 | 24–28px | 600 | Section headings |
| H3 | 20–24px | 500–600 | Subsection headings |
| H4 | 18–20px | 500–600 | Small headings |
| Body large | 16–18px | 400 | Introductory content |
| Body | 14–16px | 400 | Standard readable content |
| Secondary text | 13–14px | 400 | Supporting information |
| Caption | 12–13px | 400 | Metadata and labels |
| Button label | 14–16px | 500–600 | Clear action labels |
| Input label | 14–16px | 500 | Form labels |
| Input text | 16px minimum | 400 | Reduce accidental iOS zoom |

Rules:
- Preserve the existing font family and brand typography.
- Establish a clear visual hierarchy between headings, body text, labels, and metadata.
- Use `rem`-based sizing or the project's existing typography tokens where practical.
- Use fluid typography with `clamp()` only when supported by the existing styling approach and when it improves the design.
- Avoid headings that occupy too much vertical space on small phones.
- Prevent awkward single-word heading lines and excessive text wrapping.
- Do not make important content unreadably small just to fit more information on the screen.
- Avoid arbitrary font sizes and inconsistent font weights across pages.

### C. Buttons and touch targets

Use consistent button dimensions across the entire application.

| Button type | Suggested mobile height | Horizontal padding |
|---|---:|---:|
| Primary action | 48–52px | 16–24px |
| Secondary action | 44–48px | 16–20px |
| Compact action | 40–44px | 12–16px |
| Icon button | 44–48px | Appropriate to icon |
| Full-width mobile CTA | 48–52px | 16–24px |

Rules:
- Aim for a minimum interactive target of 44 × 44 CSS pixels, and prefer 48 × 48 pixels for frequently used actions where practical.
- Follow WCAG 2.2 AA target-size requirements, including the applicable 24 × 24 CSS pixel minimum and spacing exceptions.
- Ensure icon buttons have an adequate hit area even when the visible icon is small.
- Keep button text vertically centered and prevent clipping.
- Use consistent border radii, font weights, focus states, disabled states, and loading states.
- Avoid buttons that wrap onto multiple lines unexpectedly.
- Stack primary and secondary actions vertically when horizontal placement becomes cramped.
- Keep destructive actions visually distinct and prevent accidental activation.
- Do not make every button full width automatically. Use full width when it improves mobile usability.
- Ensure buttons remain usable when the user increases text size.

### D. Spacing, padding, and page layout

Start with a consistent 4px-based spacing scale:

- 4px: Very tight spacing.
- 8px: Related elements.
- 12px: Compact internal spacing.
- 16px: Standard mobile spacing.
- 20px: Comfortable content spacing.
- 24px: Component or section spacing.
- 32px: Larger section separation.
- 40–48px: Major section separation.

Rules:
- Use 16–20px as a starting point for horizontal page padding on mobile.
- Allow 12px on very narrow screens only when the content requires it.
- Use consistent spacing between headings, descriptions, controls, cards, and sections.
- Remove unnecessary nested padding that wastes the limited mobile viewport.
- Prevent content from touching the screen edges.
- Ensure cards, forms, tables, and modals fit within the available width.
- Use a consistent alignment system across pages.
- Avoid arbitrary margins that compensate for a broken parent layout.
- Prefer reusable spacing tokens and layout utilities.

### E. Grid, cards, and content containers

Rules:
- Use a single column for content that becomes difficult to read in two columns.
- Convert desktop card grids into appropriate mobile grids based on content density.
- Allow cards to stretch naturally without creating inconsistent heights unnecessarily.
- Avoid fixed widths that exceed the viewport.
- Use `min-width: 0` where necessary to allow flex and grid children to shrink.
- Ensure long words, URLs, identifiers, and unbroken strings do not cause overflow.
- Keep important content visible without unnecessary scrolling inside cards.
- Use `max-width` and fluid sizing appropriately.
- Preserve the existing visual hierarchy and brand styling.

### F. Forms, inputs, and selection controls

Rules:
- Prefer single-column form layouts on mobile.
- Stack related fields when horizontal arrangements become cramped.
- Keep labels visible and associate them correctly with inputs.
- Ensure inputs have sufficient height and readable text.
- Use a 16px minimum input font size where appropriate to prevent automatic zoom on iOS.
- Keep validation messages near their corresponding fields.
- Make error, success, disabled, and loading states clear.
- Ensure dropdown menus, date pickers, searchable selects, and autocomplete menus remain within the viewport.
- Prevent the on-screen keyboard from covering important controls or submission buttons.
- Preserve form values and user progress when validation fails.
- Test keyboard navigation and submission behavior.

Do not replace functional custom components with native HTML elements or new UI libraries without a demonstrated reason.

### G. Navigation, dialogs, tables, and complex components

Navigation:
- Make mobile navigation easy to discover and operate.
- Test menu opening, closing, nested items, route changes, and active states.
- Prevent navigation menus from overflowing the viewport.
- Keep important actions accessible without crowding the header.

Dialogs and popovers:
- Keep dialogs within the available viewport height and width.
- Respect mobile safe areas.
- Prevent background scrolling when appropriate.
- Ensure close controls are reachable and focus is handled correctly.
- Avoid dialogs that trap users behind inaccessible content.

Tables and data-heavy pages:
- Do not simply compress desktop tables into unreadable columns.
- Evaluate horizontal scrolling, responsive column visibility, stacked record layouts, or card-based alternatives.
- Preserve access to important fields and actions.
- Clearly indicate horizontal scrolling when it is the chosen solution.
- Keep sorting, filtering, pagination, and row actions usable.

Dashboards:
- Reflow KPI cards and charts based on available width.
- Prevent chart labels and legends from overlapping.
- Make filters and date ranges usable on mobile.
- Prioritize essential information above secondary details.
- Preserve access to full data without hiding critical functionality.

---

## 4. Phase Three: Audit Every Page Using Playwright MCP

Use Playwright MCP to inspect the actual running application in a browser.

Do not rely only on source-code inspection, screenshots supplied by me, or assumptions about how the layout should behave.

### A. Build a complete route inventory

Inspect the routing configuration and identify every accessible page.

Create a route checklist containing:
- Route and page name.
- Authentication requirements.
- Main layout or shell.
- Important interactive components.
- Required test account or prerequisite data.
- Mobile viewport sizes tested.
- Issues found.
- Fixes implemented.
- Verification status.

Include:
- Public pages.
- Authenticated pages.
- Dashboard pages.
- CRUD screens.
- Detail pages.
- Settings pages.
- Forms and multi-step workflows.
- Search and filter states.
- Empty, loading, and error states.
- Relevant modal, dropdown, and navigation states.

Do not skip a page because it appears similar to another page.

For dynamic routes, test representative valid records and relevant missing-record or error states when feasible.

If a page cannot be accessed because authentication, permissions, backend data, or environment configuration is unavailable, document the blocker explicitly. Never claim it has been tested.

### B. Test responsive viewport sizes

At minimum, test representative sizes:
- 320 × 568.
- 360 × 800.
- 375 × 812.
- 390 × 844.
- 414 × 896.
- 768 × 1024.
- 1024 × 768.
- 1440 × 900.

Use these as viewport dimensions, not claims about exact physical device behavior.

Prioritize 320px, 375px, 390px, and 414px for mobile testing. Expand the test matrix for pages with complex tables, dashboards, navigation, or forms.

Where practical, also test:
- Portrait and landscape.
- Browser zoom or enlarged text.
- Long content and localized text.
- On-screen keyboard behavior.
- Safe-area insets.
- Reduced-motion preferences.
- Touch interactions and hover-dependent components.

A desktop browser using a mobile viewport is not a complete substitute for testing on a real mobile device. Be explicit about the coverage achieved.

### C. Inspect the rendered interface

For each route and representative viewport:
1. Navigate to the page.
2. Wait for the application to reach a stable state.
3. Capture a screenshot.
4. Inspect the page layout and visual hierarchy.
5. Check for horizontal overflow.
6. Check text wrapping, clipping, truncation, and overlapping elements.
7. Check button sizes, spacing, and touch target accessibility.
8. Inspect navigation, dropdowns, dialogs, forms, and interactive states.
9. Review browser console errors and failed network requests when available.
10. Test critical interactions instead of relying only on screenshots.

Use DOM measurements, computed styles, accessibility snapshots, screenshots, and browser interaction tools when available through Playwright MCP.

Do not claim a test passed unless it was actually executed.

### D. Detect common mobile defects

Specifically search for:
- Horizontal page scrolling.
- Content extending beyond the viewport.
- Fixed-width components.
- Text jumping or layout shifts.
- Overlapping buttons, headings, labels, or icons.
- Cards with inconsistent padding.
- Inconsistent heading sizes.
- Navigation that cannot be closed.
- Dropdowns rendered outside the viewport.
- Modals that exceed screen height.
- Buttons with tiny hit areas.
- Inputs covered by the mobile keyboard.
- Tables that become unreadable.
- Images with distorted aspect ratios.
- Charts that overflow.
- Sticky headers that cover page content.
- Excessive vertical whitespace.
- Excessively dense layouts.
- Low-contrast text and controls.
- Missing focus indicators.
- Content hidden behind fixed bottom navigation.
- Inconsistent loading and empty states.
- Layout instability caused by images, fonts, or asynchronous content.
- Hover-only interactions that fail on touch screens.
- Broken navigation or inaccessible actions.

### E. Automated overflow checks

Use Playwright to check document and element dimensions.

Example checks:

```js
const dimensions = await page.evaluate(() => ({
  viewportWidth: document.documentElement.clientWidth,
  documentWidth: document.documentElement.scrollWidth,
  viewportHeight: window.innerHeight,
  documentHeight: document.documentElement.scrollHeight,
}));

console.log(dimensions);
```

Flag unexpected horizontal overflow when:

`documentWidth > viewportWidth`

Also inspect overflowing individual elements, because a page-level check may not identify the exact cause.

Do not blindly apply `overflow-x: hidden` to conceal defects. Find and fix the underlying layout problem first. Intentional horizontal scrollers, such as data tables, should be evaluated separately.

Use reliable selectors and the project's existing testing conventions. Avoid brittle tests that depend on exact DOM positions or generated CSS class names.

---

## 5. Phase Four: Create an Evidence-Based Improvement Plan

Before implementation, produce a concise audit report.

For each issue, include:

| Field | Required information |
|---|---|
| Page | Route and component |
| Viewport | Width and height where it occurs |
| Problem | Specific observed defect |
| Evidence | Screenshot, DOM measurement, or reproducible test |
| Severity | Critical, high, medium, or low |
| Root cause | CSS, component logic, content, or interaction issue |
| Proposed fix | Specific implementation approach |
| Scope | Shared component or page-specific fix |
| Regression risk | What might break |
| Verification | How the fix will be tested |

Prioritize issues using this order:

1. **Critical:** Broken workflows, inaccessible primary actions, unusable pages, or severe content loss.
2. **High:** Horizontal overflow, clipped controls, broken navigation, unusable forms, and major layout defects.
3. **Medium:** Inconsistent spacing, typography, component sizing, and visual hierarchy.
4. **Low:** Minor decorative adjustments and nonessential refinements.

Fix shared component problems before making repeated page-specific patches.

Do not redesign working components simply because a different style looks more fashionable.

---

## 6. Phase Five: Implement the Improvements

After the audit, implement the highest-impact fixes systematically.

### Implementation rules

- Preserve the existing brand identity, colors, typography, and established design language.
- Establish reusable responsive tokens and component variants.
- Use consistent heading, body, caption, button, input, spacing, radius, and breakpoint rules.
- Fix the root cause instead of adding repeated CSS overrides.
- Prefer reusable components for patterns repeated across multiple pages.
- Avoid duplicating responsive logic.
- Keep component APIs simple and predictable.
- Remove genuinely unused code only after verifying references.
- Avoid unnecessary dependencies and large-scale rewrites.
- Preserve desktop and tablet behavior.
- Maintain accessibility and keyboard functionality.
- Do not remove existing features just to simplify mobile layouts.
- Do not replace real application data with mock data.
- Do not weaken validation or permissions to make tests pass.
- Do not modify backend behavior unless a frontend fix genuinely depends on it and the change is authorized.

When a shared component changes, identify every page that uses it and run regression checks on those pages.

Implement changes in small, coherent batches so problems can be isolated and corrected.

---

## 7. Phase Six: Verify Every Fix With Playwright MCP

After implementation, repeat the relevant browser tests.

For each fixed issue:
1. Reopen the affected route.
2. Reproduce the original viewport.
3. Confirm the defect is resolved.
4. Check adjacent screen widths.
5. Test the affected interactions.
6. Check for console errors and unexpected failed requests.
7. Verify that the desktop layout remains correct.
8. Capture a new screenshot.
9. Update the audit checklist.

Run existing lint, type-check, build, and automated tests when available.

Do not ignore newly introduced errors. Distinguish pre-existing failures from regressions using the initial baseline.

For visual comparisons, account for asynchronous content, animations, font loading, and dynamic data. Use stable test data where possible.

Avoid relying exclusively on screenshot similarity. A page may look correct while its buttons, navigation, or forms are broken.

### Regression requirements

- Check every route affected by shared component changes.
- Retest important user workflows.
- Confirm there is no unexpected horizontal overflow.
- Confirm primary actions remain visible and usable.
- Confirm desktop layouts still work.
- Confirm no new console errors or critical accessibility regressions were introduced.

---

## 8. Phase Seven: Accessibility and Performance

Include these checks as part of the audit:

### Accessibility
- Semantic headings and logical hierarchy.
- Correct accessible names for buttons and icon-only controls.
- Labels for form fields.
- Visible keyboard focus.
- Logical focus order.
- Keyboard-operable menus and dialogs.
- Appropriate contrast against WCAG 2.2 AA requirements.
- Accessible validation and error messages.
- Touch target sizing and spacing.
- Text enlargement without loss of content or functionality.
- Reduced-motion support for nonessential animation.

### Performance and stability
- Avoid unnecessary re-renders and duplicated components.
- Prevent layout shifts caused by images and dynamic content.
- Reserve image space using dimensions or aspect ratios.
- Avoid expensive animations on lower-powered devices.
- Keep mobile interactions responsive.
- Avoid introducing heavy libraries for simple layout fixes.
- Check for layout changes caused by font loading and delayed API responses.

Do not claim full WCAG compliance or performance compliance without running the relevant checks. Document what was actually tested.

---

## 9. Working Rules

Follow these rules throughout the task:

1. Inspect before editing.
2. Establish the baseline before making changes.
3. Audit every route rather than sampling only the homepage.
4. Use Playwright MCP for real browser verification.
5. Base fixes on observed defects and measurable usability problems.
6. Plan before large changes.
7. Fix shared components before duplicating solutions.
8. Preserve functionality and existing design language.
9. Never hide overflow to make a screenshot look correct.
10. Never claim an untested page has passed.
11. Never silently skip inaccessible routes.
12. Never overwrite environment configuration, secrets, or production data.
13. Avoid destructive database or deployment operations.
14. Ask for approval before major architectural changes or actions with external consequences.
15. If Playwright MCP is unavailable, inspect the available tools and configuration first. Report the blocker and use a clearly identified fallback only when appropriate.
16. If information is missing, distinguish assumptions from verified facts.
17. Continue through implementation and verification instead of stopping at recommendations.
18. Do not ask me to make decisions that can be resolved safely from the existing codebase and design language.

---

## 10. Final Deliverables

When the task is complete, provide:

### A. Mobile audit summary
- Total routes discovered.
- Routes tested.
- Routes not tested and why.
- Viewports tested.
- Total issues found and fixed.
- Remaining issues and blockers.

### B. Design system changes
Document the final typography scale, button dimensions, touch targets, spacing scale, breakpoints, page padding, and responsive component rules.

### C. Issues fixed
List each important issue, its root cause, the files or components changed, and the result.

### D. Playwright verification results
Report actual test results for mobile and desktop, including overflow checks, interaction tests, screenshots, and any failures.

### E. Remaining risks
List unresolved visual issues, accessibility concerns, unsupported states, and any limitations of browser-based mobile testing.

### F. Code quality
Report the results of linting, type checking, builds, and automated tests where available. Mention any pre-existing failures separately.

### G. Recommended next steps
Rank any remaining improvements by impact and effort.

## Definition of Done

The task is complete only when:
- Every discovered route has been tested or has an explicitly documented blocker.
- The shared responsive design rules are consistent.
- All critical and high-priority mobile defects have been fixed or have a documented blocker.
- Relevant Playwright tests have been rerun successfully.
- Shared component changes have been regression-tested.
- Desktop behavior has been preserved.
- Existing lint, build, and type checks have been run where available.
- The final report accurately distinguishes verified results from assumptions.

**Start now:** Inspect the codebase and Playwright MCP availability, establish the baseline, inventory all routes, and audit the mobile experience. Produce the prioritized plan, then implement and verify the improvements in controlled batches. Do not stop after the planning phase unless a genuine blocker requires my input.