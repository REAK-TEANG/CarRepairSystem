---
name: build-premium-ui
description: A guided workflow for building a new UI component or page with premium design and optimal token usage.
---

# Build Premium UI Workflow

Activate this skill when the user asks to build a new UI component, page, or feature.

## Step 1: Component Breakdown (Token Efficiency)
- Analyze the requested UI.
- Instead of building a massive single file, break the design into logical, small sub-components.
- *Reasoning:* Smaller files mean smaller context windows when making future edits.

## Step 2: Implement the Design System
- Create or update the CSS file (Vanilla CSS preferred) to establish the necessary tokens (colors, fonts, spacing).
- Ensure a premium look by incorporating:
  - Harmonious color palettes (e.g., sleek dark mode with vibrant accents).
  - Smooth gradients and glassmorphism.

## Step 3: Write the Component Code
- Build the React/HTML structure using semantic tags.
- Apply the CSS classes defined in Step 2.
- Implement micro-animations (hover effects, active states) directly in the CSS.

## Step 4: Verification
- Check that the component is fully responsive.
- Ensure no hardcoded inline styles were used unnecessarily.
- Verify that the code is concise and focused.
