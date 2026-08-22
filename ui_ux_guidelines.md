# Car Repair System - UI/UX Guidelines

This document outlines the design principles, color palette, typography, and UX guidelines to follow when building the Car Repair Shop Management System.

> **Core Directive:**  
> "Design a clean, intentional user interface for Car Repair Shop Management System that prioritizes high information density, precise typographic hierarchy, and genuine utility. Avoid all generic AI tropes: no glowing neon gradients, no random floating glassmorphism cards, no corporate Memphis illustrations, and no overly rounded pill shapes. Use a disciplined, restrained color palette (at most two primary tones, grounded neutrals). Rely on crisp 1px borders, structured grids, and high-contrast typography. The final design should feel like a well-crafted, professional tool built by humans who care about speed and clarity."

---

## 1. Design Philosophy
- **High Information Density & Utility:** Structured for workshop speed, rapid scannability, and high data density without clutter.
- **Disciplined, Restrained Palette:** Grounded deep slate/charcoal neutrals paired with high-contrast functional accents (`#B5FF57` Electric Lime & `#13F287` Mint Neon).
- **Crisp Structural Geometry:** Crisp 1px border dividers (`#323B43`), structured grids, and clean border radii. No floaty glassmorphism traps or generic corporate illustrations.
- **Clean System Typography:** Powered by **SF UI Display** / Apple System fonts (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `Inter`).

---

## 2. Color Palette (Exact Specifications)

### Primary Dark Colors
- **Canvas / App Background (`dark-bg`):** `#101214` - Deep charcoal black for main background.
- **Card & Sidebar Surface (`dark-card`):** `#282F35` - Dark slate gray for widget containers, sidebars, header, and tables.
- **Input & Hover Surface (`dark-hover`):** `#1E2328` - Subtly darker tone for hover states and form input fields.
- **Border / Separation Lines (`dark-border`):** `#323B43` - Clean border divider.

### Vibrant Green Accents
- **Primary Accent (Electric Lime):** `#B5FF57` - Active navigation pills, primary CTAs, main metric highlights.
- **Secondary Accent (Mint / Emerald Neon):** `#13F287` - Secondary buttons, status badges, chart lines, and positive trends.

### Text & Contrast
- **Primary Text:** `#F8FAFC` - Bright white for headings, metric values, and primary text.
- **Secondary Text:** `#A0AEC0` / `#8A99AD` - Muted slate for subheadings, captions, and section titles.
- **Accent Text Contrast:** `#101214` - Deep charcoal text overlay inside `#B5FF57` or `#13F287` pills.

---

## 3. Typography & Font Weight Hierarchy

To ensure the design looks refined, balanced, and readable (not overly heavy or bold):

- **Font Family:** `"SF UI Display"`, `-apple-system`, `BlinkMacSystemFont`, `"SF Pro Display"`, `"Inter"`, `sans-serif`.
- **Page Titles (h1):** `font-bold` (700) or `font-semibold` (600) — reserved strictly for main section headers.
- **Metric Values & Numbers:** `font-bold` (700) with `tabular-nums`.
- **Section Headers & Card Titles (h2, h3):** `font-semibold` (600).
- **Navigation Links & Buttons:** `font-medium` (500) — sleek and lightweight.
- **Body Text, Table Rows, Descriptions:** `font-normal` (400) — clean, regular weight text for optimal scannability.
- **Avoid Heavy Weights:** Do not apply `font-bold` or `font-extrabold` to table rows, descriptions, or general body copy.

---

## 4. Tailwind CSS Token Mapping

```js
colors: {
  accent: {
    DEFAULT: '#B5FF57', // Electric Lime
    emerald: '#13F287', // Mint / Emerald Neon
  },
  dark: {
    bg:     '#101214', // Canvas background
    card:   '#282F35', // Card & Surface background
    hover:  '#1E2328', // Input / Hover background
    border: '#323B43', // Border color
  }
}
```
