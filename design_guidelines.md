# Design Guidelines: AI Browser Automation Platform

## Design Approach

**System Foundation**: Material Design adapted for developer tools, drawing inspiration from Linear's clarity, VS Code's information architecture, and Stripe's restraint.

**Core Principle**: Information clarity and workflow efficiency over visual decoration. This is a productivity tool for technical users—prioritize functionality, readability, and reducing cognitive load.

---

## Layout System

**Grid Structure**: 
- Main app uses a sidebar navigation (240px width) + main content area layout
- Content area max-width: 1400px for optimal reading and data display
- Use consistent spacing primitives: 4, 8, 12, 16, 24, 32, 48px (Tailwind: 1, 2, 3, 4, 6, 8, 12)
- Dashboard cards/panels: 16px padding on mobile, 24px on desktop
- Section spacing: 24px between related groups, 48px between major sections

**Component Spacing**:
- Tight spacing (4-8px) for related items within components
- Medium spacing (16-24px) for component groups
- Generous spacing (32-48px) between distinct sections

---

## Typography

**Font Stack**:
- Primary: Inter (Google Fonts) for UI text
- Monospace: JetBrains Mono (Google Fonts) for code, logs, and JSON output

**Scale** (using Tailwind sizes):
- Hero/Page titles: text-3xl (30px) font-bold
- Section headers: text-xl (20px) font-semibold
- Card/Panel titles: text-lg (18px) font-medium
- Body text: text-base (16px) font-normal
- Secondary/metadata: text-sm (14px) font-normal
- Code/logs: text-sm (14px) monospace
- Captions: text-xs (12px) font-normal

**Hierarchy Rules**:
- Use font weight variation (400, 500, 600, 700) for hierarchy, not just size
- All-caps for labels/badges (uppercase + letter-spacing + text-xs)
- Line height: 1.5 for body, 1.2 for headings

---

## Component Library

### Navigation
**Sidebar Navigation** (left-aligned, 240px):
- Logo at top (32px height)
- Main navigation items (icon + label, 40px height each)
- Active state: subtle background fill + accent border-left (3px)
- Collapsible sections for organization
- Bottom: user profile/settings

### Dashboard Cards
**Automation Cards**:
- White/dark surface with 1px border, 8px rounded corners
- Header: icon (24px) + title + action menu (3-dot)
- Metadata row: status badge + last run time + duration
- Footer: stats (actions count, success rate) + primary CTA button

**Execution Log Panel**:
- Monaco editor integration for syntax highlighting
- Line numbers on left
- Color-coded log levels: info (blue), success (green), warning (orange), error (red)
- Timestamp + category + message layout
- Auto-scroll toggle

### Forms & Inputs
**Workflow Builder Input**:
- Large textarea (minimum 120px height) with placeholder text
- Character counter at bottom-right
- Submit button: prominent, primary color, positioned bottom-right
- Add step button: secondary style, icon + text

**Template Cards**:
- Grid layout: 2 columns mobile, 3 columns tablet, 4 columns desktop
- Card: icon (48px) + title + description + "Use Template" button
- Hover state: subtle elevation increase (shadow)

### Data Display
**Extracted Data Table**:
- Sticky header row
- Alternating row backgrounds for readability
- Compact row height (48px) for data density
- Copy button per cell on hover
- Export button (top-right): icon + "Export" text

**Token Usage Chart**:
- Simple bar chart showing prompt/completion tokens
- Total cost displayed prominently (large number + currency)
- Breakdown: request count + average tokens per request

### Action Components
**Primary Button**: 
- Height: 40px (py-2.5)
- Padding: 16px horizontal (px-4)
- Rounded: 6px (rounded-md)
- Font: text-sm font-medium
- States: default, hover (slight brightness), active (pressed), disabled (reduced opacity)

**Icon Buttons**: 
- 36px square
- Rounded: 4px
- Icons: 20px size
- Use for actions like delete, edit, copy, refresh

### Status Indicators
**Execution Status**:
- Badges with icon + text: "Running" (animated pulse), "Success" (checkmark), "Failed" (X), "Queued" (clock)
- 24px height, 6px rounded, 8px horizontal padding
- Icons: 14px size

**Progress Bar**:
- Full-width, 4px height
- Animated for active executions
- Segmented for multi-step workflows (show step count)

---

## Workflow Builder Interface

**Visual Flow Editor**:
- Canvas area with grid background (subtle)
- Nodes: 200px width, auto height, rounded corners (8px), shadow on hover
- Node types: Start (green accent), Action (blue), Extract (purple), Decision (orange), End (gray)
- Connection lines: curved paths, 2px stroke
- Drag handles: 8px circles on node edges
- Add action button: floating "+" button between nodes

**Side Panel** (right-aligned, 320px):
- Action configuration form when node selected
- Schema builder for extraction actions (Zod schema visual editor)
- Test/preview button per node

---

## Animations

**Minimal & Purposeful**:
- Loading states: subtle spinner (24px) for actions, shimmer for skeleton loading
- Transitions: 150ms duration for most interactions (hover, expand/collapse)
- Page transitions: fade in (200ms) on route change
- Success feedback: green checkmark with 300ms fade-in when action completes
- No decorative animations—focus on functional feedback only

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (single column, collapsible sidebar)
- Tablet: 768px - 1024px (2 columns where applicable)
- Desktop: > 1024px (full multi-column layouts)

**Mobile Adaptations**:
- Sidebar becomes bottom navigation or hamburger menu
- Cards stack vertically
- Tables become scrollable or transform to card view
- Reduce padding/spacing by ~30%

---

## Dark Mode (Primary Theme)

**Philosophy**: Dark mode as default for reduced eye strain during extended use sessions. Light mode available as toggle.

**Surface Hierarchy** (darkest to lightest):
- App background: near-black base
- Card/panel backgrounds: slightly lighter than base
- Input backgrounds: even lighter, subtle contrast
- Hover states: +5% brightness
- Text on dark: white with opacity variants (100%, 70%, 50%)

---

## Accessibility

**Keyboard Navigation**:
- All interactive elements focusable with visible focus rings
- Escape to close modals/panels
- Enter to submit forms
- Arrow keys for navigating lists/tables

**Screen Readers**:
- Semantic HTML throughout
- ARIA labels for icon-only buttons
- Live regions for status updates
- Role attributes for custom components

---

## Special Considerations

**Code Display**:
- Use Monaco editor for all code editing/viewing
- Syntax themes: VS Code Dark+ for dark mode, Light+ for light mode
- Line wrap toggle for long outputs
- Copy button (top-right corner) on all code blocks

**Real-time Updates**:
- WebSocket status indicator (top-right): connected (green dot), disconnected (red dot)
- Live badge on actively running automations
- Toast notifications (bottom-right) for completion/error events: 4-second duration, dismissible

**Empty States**:
- Centered content with illustration/icon (80px)
- Helpful message explaining why empty
- Primary CTA to take first action
- Example: "No workflows yet" → "Create Your First Automation" button

---

## Images

**Hero Section**: None required—this is a productivity application, not marketing. Jump directly into functionality.

**Template Cards**: Each template has a category icon (48px, duotone style):
- E-commerce scraping: shopping cart
- Form automation: document with checkmark  
- Research: magnifying glass
- Competitive analysis: chart trending up
- Lead generation: user group

**Empty State Illustrations**: Simple line art (160px) for empty workflow list, no extraction results, no execution history.

---

This design prioritizes clarity, efficiency, and technical precision—reflecting the tool's purpose as a professional automation platform for developers and power users.