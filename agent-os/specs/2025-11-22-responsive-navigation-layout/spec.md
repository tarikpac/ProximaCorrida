# Specification: Responsive Navigation & Layout

## Goal
Implement a fully responsive, sticky header with a mobile navigation drawer and an expanded footer to improve site navigation and accessibility across all device sizes.

## User Stories
- As a mobile user, I want to access the menu via a hamburger button so that I can navigate to different sections without cluttering the screen.
- As a desktop user, I want to see all primary navigation links in the header so that I can quickly access key pages.
- As a user, I want to see which page I am currently on via an active visual indicator so that I know my location within the site.

## Specific Requirements

**Responsive Header**
- Maintain existing `sticky top-0` positioning with blur effect.
- **Mobile (< md):** Display Logo on the left and Hamburger Menu button on the right.
- **Desktop (≥ md):** Display Logo on the left and full inline navigation links on the right.
- Use standard Tailwind `md` breakpoint for switching layouts.

**Mobile Navigation Drawer**
- Implement a side drawer that slides in from the **right** when the hamburger menu is clicked.
- Include a dark background overlay that closes the menu when clicked.
- Include a "X" close button at the top of the drawer.
- List all navigation items vertically within the drawer.
- Animate the drawer entrance/exit (`transition-transform`, `translate-x`).

**Navigation Items & Active State**
- **Links:** Home (`/`), Calendário (`/calendario`), Estados (`/estados`), Calculadora de Pace (`/calculadora-pace`), Área do Organizador (`/organizador`).
- **Active State:** Highlight the current route's link with `text-lime-400` and a bottom border/underline (`border-b-2 border-lime-400`).
- **Default State:** `text-zinc-400`.
- **Hover State:** `text-lime-400`.

**Footer Expansion**
- Expand the footer to include a structured layout.
- **Links:** Sobre (`/sobre`), Estados (`/estados`), Área do Organizador (`/organizador`), Termos de Uso (`/termos`), Política de Privacidade (`/privacidade`).
- **Social Icons:** Add Instagram icon (linking to `#` for MVP) using `lucide-react`.
- Maintain the existing "light brutalism" aesthetic (fonts, colors, uppercase tracking).

## Visual Design

**No visual assets provided.**
- Follow existing design system:
    - Colors: `zinc-950` (bg), `lime-400` (accent), `zinc-400` (text).
    - Typography: Font Mono, Uppercase, Tracking Widest.
    - Icons: `lucide-react`.

## Existing Code to Leverage

**`apps/web/src/components/ui/navbar.tsx`**
- Reuse the existing component structure.
- Refactor the mobile menu to be a side drawer instead of a dropdown.
- Update the `isActive` logic to include the bottom border style.

**`apps/web/src/components/ui/footer.tsx`**
- Reuse the existing component.
- Add the new links (Termos, Privacidade) and Social Icons section.
- Adjust layout to accommodate the new content.

## Out of Scope
- Implementation of the actual pages (`/calendario`, `/sobre`, `/termos`, etc.) - only the links are required.
- Newsletter signup form.
- App download buttons.
- Multi-language support implementation (keep placeholder if exists).
