---
trigger: always_on
description: Core guidelines for creating high-quality UI/UX while maintaining token efficiency.
---

# UI/UX & Efficiency Workflow Rules

To ensure a smooth workflow, incredible user experience, and token efficiency, strictly adhere to the following rules:

## 1. Token Efficiency (Save Context)
- **Be Concise:** Write minimal, focused code. Avoid regenerating entire files when making small edits; use diffs or specific replacements instead.
- **Modularization:** Break down large UI components into smaller, reusable React/frontend components. This allows for targeted edits and smaller context windows.
- **Avoid Hallucinations:** Always refer to existing design tokens, components, and CSS classes. Do not reinvent utility classes if they already exist in the project.

## 2. Best UI/UX Design Practices
- **Shadcn UI First:** ALL frontend components and design must use Shadcn UI components. NEVER create raw HTML and CSS if a Shadcn component exists for the use case (e.g., use `<Button>` instead of `<button class="...">`).
- **Rich Aesthetics:** Ensure designs look premium and modern. Use vibrant, harmonious color palettes, subtle gradients, and glassmorphism where appropriate.
- **Interactive & Dynamic:** Add micro-animations (e.g., hover effects, active states, smooth transitions) to make the UI feel alive and responsive.
- **Modern Typography:** Use clean, modern fonts (like Inter, Roboto, or Outfit) with clear hierarchy and readable contrast.

## 3. Accessibility & Structure
- Ensure all interactive elements have visible focus states.
- Use semantic HTML tags (`<nav>`, `<main>`, `<article>`) instead of nested `<div>` soup.
- Ensure unique and descriptive IDs are used for all major interactive elements.