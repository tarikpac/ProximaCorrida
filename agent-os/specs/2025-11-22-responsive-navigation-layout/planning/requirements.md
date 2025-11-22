# Spec Requirements: Responsive Navigation & Layout

## Initial Description
Implement a fully responsive header, navigation menu, and footer that adapts seamlessly to mobile, tablet, and desktop screens.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the header should include the logo and a hamburger menu for mobile, and a full navigation bar for desktop. Is that correct, or do you have a different layout in mind?
**Answer:** Yes, that is the standard layout.
- **Mobile (< md):** Logo on the left, Hamburger icon on the right (opening side menu).
- **Desktop (≥ md):** Logo on the left, Full navigation on the right (inline links).
- The Navbar is already sticky with blur, this must be maintained.

**Q2:** I'm thinking the mobile menu should slide in from the right or left. Do you have a preference?
**Answer:** Preference: **Slide-in from the right**.
- Reasons: More common in modern apps, doesn't visually conflict with the logo on the left, matches the "panel" style.
- Interaction: Sliding side menu from the right when clicking the hamburger.

**Q3:** For the footer, I assume it should contain links to "About", "Contact", "Terms", "Privacy", and social media icons. Should we include anything else like a newsletter signup or app download links?
**Answer:** The footer should evolve from simple (logo + copyright) to:
- **Links:** Sobre (/sobre), Estados (/estados), Área do Organizador (/organizador), Termos de Uso (placeholder /termos), Política de Privacidade (placeholder /privacidade).
- **Social Icons:** Instagram (future: X/Twitter, YouTube).
- **MVP Exclusions:** No newsletter or "download app" links for now.

**Q4:** I assume the navigation items should be: "Home", "Calendário" (Calendar), "Calculadora de Pace", "Área do Organizador", and "Estados" (States). Are there any other primary navigation links?
**Answer:**
- **Items:**
    - Home (/) - Logo already links here, text optional in mobile menu.
    - Calendário (/calendario) - *Note: This page is Phase 13 of roadmap.*
    - Estados (/estados)
    - Calculadora de Pace (/calculadora-pace)
    - Área do Organizador (/organizador)
- **Desktop Layout:** Calendário | Estados | Calculadora de Pace | Organizador | [Bell Icon/Language - optional/future]
- **Mobile Layout:** Same items listed inside the side menu.

**Q5:** Should the header be sticky (fixed at the top) as the user scrolls down?
**Answer:** Yes, **header sticky**.
- Keep `sticky top-0` as it is now.
- Goals: Quick access to menu, calendar, and calculator; better UX on long mobile scrolls.

**Q6:** For the "active" state of navigation links, I assume we should use a distinct color or underline. Do you have a specific style preference?
**Answer:** Clear visual indication, ProximaCorrida style.
- **Active Color:** Text in `lime-400` (same as current hover).
- **Visual Indicator:** Underline with offset OR small bottom border (`border-b-2` in lime).
- **Example:** Normal: `text-zinc-400`; Hover: `text-lime-400`; Active: `text-lime-400` + bottom border.

**Q7:** Are there any specific breakpoints we should target for tablet and desktop layouts (e.g., standard Tailwind breakpoints `md` and `lg`)?
**Answer:** Use standard Tailwind breakpoints.
- **Mobile:** `< md` (hamburger menu, compact header).
- **Tablet/Desktop:** `≥ md` (full inline menu).
- `lg` only for spacing/typography refinement.
- **Main Switch:** `md`.

**Q8:** Are there any specific interactions or animations you'd like to see (e.g., smooth transition for the mobile menu, hover effects for desktop links)?
**Answer:** Subtle animations.
- **Mobile Menu:** Smooth transition (`transition-transform`, `duration-200/300`), slide in from right (`translate-x-full` -> `translate-x-0`), dark background overlay with click-to-close.
- **Desktop Links:** Hover color change to lime, simple underline animation.
- **Close Button:** Simple "X" at the top of the drawer.

### Existing Code to Reference
**Similar Features Identified:**
- **Navbar:** Reuse current `apps/web/src/components/ui/navbar.tsx` as base. Connect hamburger button (currently placeholder) and add mobile side menu.
- **Footer:** Reuse current `apps/web/src/components/ui/footer.tsx` and expand with institutional links and social icons.
- **Visual Style:** Maintain existing fonts, colors, borders, "light brutalism".

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Responsive Header:**
    - Sticky positioning (`top-0`).
    - **Mobile (< md):** Logo (left), Hamburger (right).
    - **Desktop (≥ md):** Logo (left), Inline Navigation (right).
- **Mobile Navigation Drawer:**
    - Slide-in from **right**.
    - Overlay background (click to close).
    - Close button ("X").
    - Navigation links list.
    - Smooth transitions.
- **Navigation Items:**
    - Home (`/`)
    - Calendário (`/calendario`)
    - Estados (`/estados`)
    - Calculadora de Pace (`/calculadora-pace`)
    - Área do Organizador (`/organizador`)
- **Active State:**
    - `text-lime-400` + bottom border/underline for current route.
- **Footer:**
    - Expanded content.
    - Links: Sobre, Estados, Área do Organizador, Termos, Privacidade.
    - Social Icons: Instagram.

### Reusability Opportunities
- **Existing Navbar:** `apps/web/src/components/ui/navbar.tsx` - Modify to add responsive logic and mobile menu.
- **Existing Footer:** `apps/web/src/components/ui/footer.tsx` - Expand content.
- **Tailwind Config:** Use existing colors (`lime-400`, `zinc-400`, etc.) and breakpoints.
- **Icons:** Use `lucide-react` (Menu, X, Instagram, etc.).

### Scope Boundaries
**In Scope:**
- Responsive Header implementation.
- Mobile Menu (Drawer) implementation.
- Footer expansion.
- Navigation routing and active state logic.

**Out of Scope:**
- Implementation of the actual pages linked (e.g., `/calendario`, `/sobre`, `/termos` content is not part of this task, just the links).
- Newsletter signup.
- App download links.
- Multi-language support (for now).

### Technical Considerations
- **Framework:** Next.js 16 (App Router).
- **Styling:** TailwindCSS v4.
- **Icons:** Lucide React.
- **State Management:** Local state for mobile menu open/close (React `useState`).
- **Routing:** `usePathname` hook to determine active link.
- **Accessibility:**
    - `aria-label` for hamburger and close buttons.
    - Focus management for mobile drawer (trap focus if possible, or at least ensure logical tab order).
    - Semantic HTML (`<nav>`, `<footer>`, `<ul>`, `<li>`).
