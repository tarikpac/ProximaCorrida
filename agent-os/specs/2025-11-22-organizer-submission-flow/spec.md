# Specification: Organizer Submission Flow

## Goal
Create a dedicated "Área do Organizador" page (`/organizador`) to allow event organizers to submit their races via an embedded Google Form (or link), serving as a simple MVP submission channel without backend complexity.

## User Stories
- As an **Event Organizer**, I want to **access a dedicated page** so that I can understand how to submit my race to the platform.
- As an **Event Organizer**, I want to **fill out a submission form** so that my event can be reviewed and listed on ProximaCorrida.
- As an **Event Organizer**, I want to **see the benefits of listing my race** so that I am motivated to submit my event.

## Specific Requirements

**Page Structure & Content**
- Create a new page at `/organizador` using the standard institutional layout (Navbar, Footer, Main Container).
- **Hero Section:** Display a prominent title "Divulgue sua corrida no ProximaCorrida" and a subtitle highlighting the value proposition.
- **Benefits Section:** Include a list of benefits (Free promotion, National reach, Centralized info) using a clean, icon-based layout.
- **How it Works:** Display a simple 3-step process: 1. Fill Form -> 2. Validation -> 3. Publication.

**Submission Form Integration**
- **Primary Method:** Embed the Google Form using an `iframe` within the page content.
- **Fallback/Mobile UX:** Provide a prominent "Preencher Formulário" button that opens the Google Form in a new tab (better for mobile or if iframe fails).
- **Configuration:** Store the Google Form URL in a dedicated constant file (e.g., `src/config/constants.ts`) to allow easy updates without code changes.
- **Placeholder:** Use a placeholder URL initially if the real form is not ready.

**Navigation Updates**
- **Desktop Navbar:** Ensure the "ORGANIZADOR" link points to `/organizador`.
- **Mobile Menu:** Ensure the "ORGANIZADOR" link points to `/organizador`.
- **Footer:** Add a text link "Área do Organizador" pointing to `/organizador`.

**SEO & Metadata**
- Add specific metadata for the page:
    - Title: "Área do Organizador - Divulgue sua Corrida | ProximaCorrida"
    - Description: "Divulgue sua corrida de rua gratuitamente no ProximaCorrida. Alcance corredores de todo o Brasil."

## Visual Design
No visual assets provided.
- **Style Guide:** Follow the existing "Institutional" aesthetic (e.g., `/sobre`):
    - Dark background (`bg-zinc-950`).
    - Lime accents (`text-lime-400`) for emphasis.
    - Uppercase, italic, bold typography for headings.
    - Zinc grays for body text.

## Existing Code to Leverage

**`apps/web/app/sobre/page.tsx`**
- Reuse the overall page structure: `<main>`, `<Navbar>`, `<Footer>`, and the section containers.
- Reuse the `FeatureCard` component pattern (icon + title + description) for the "Benefits" section.
- Reuse the Hero section styling (centered text, large heading).

**`apps/web/components/ui/navbar.tsx`**
- The `Navbar` component already contains the links. We just need to verify/update the `href` for "Organizador" (it seems it might already be there or needs a check).

**`apps/web/components/share/share-button.tsx`**
- Reference button styling patterns if needed for the "Open Form" CTA (though a standard link button might be simpler).

## Out of Scope
- **Backend API:** No endpoints for event creation.
- **Database:** No changes to the database schema.
- **Authentication:** No login/signup for organizers.
- **Dashboard:** No management area for organizers.
- **Validation:** No automated validation of form data (manual process via Google Sheets/Forms).
