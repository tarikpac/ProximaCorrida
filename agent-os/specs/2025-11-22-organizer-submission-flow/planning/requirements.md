# Spec Requirements: Organizer Submission Flow

## Initial Description
Create an "Area do Organizador" with a submission form (MVP: Google Forms integration) for manual race entry and approval.

## Requirements Discussion

### First Round Questions

**Q1:** Implementation Method: The roadmap mentions "Google Forms integration". I assume for this MVP you want a simple page that embeds a Google Form (iframe) or provides a direct link to it, rather than building a full native form with backend endpoints right now. Is that correct?
**Answer:** Yes, for the MVP exactly that: A simple page that embeds the Google Forms via `<iframe>` or, if UX is an issue, displays a prominent "Open form in Google Forms" button/link. No native CRUD, login, or dashboard yet. Just a quick submission channel via Google Forms.

**Q2:** Route & Navigation: I'm thinking of creating a new page at `/organizador` and adding a link to it in the Footer (and potentially the mobile menu). Does that sound right?
**Answer:** Yes. Route: `/organizador`. Navigation: The existing "ORGANIZADOR" item in the navbar should point to `/organizador`. In the mobile menu, this link should also appear. In the footer, repeat a text link: "Área do Organizador" -> `/organizador`.

**Q3:** Page Content: Apart from the form/link, should we include a brief "Benefits" section (e.g., "Divulgue grátis", "Alcance mais corredores") to encourage submissions?
**Answer:** Yes, the page shouldn't be just a thrown-in iframe. Structure imagined:
- **Title:** "Divulgue sua corrida no ProximaCorrida"
- **Subtitle / benefits bullets:** "Divulgação gratuita para corredores de todo o Brasil", "Alcance mais atletas no seu estado", "Centralize as informações oficiais do seu evento".
- **"How it works" block (short):** 3 steps: 1. Fill in the form with race data, 2. Our team validates the info, 3. Your race appears on the calendar and ProximaCorrida list.
- **Embedded Google Form (iframe)** or "Fill form" button opening in new tab.

**Q4:** Google Form URL: Do you already have the Google Form created? If so, I'll need the URL (or embed code) to implement this. If not, should I just use a placeholder for now?
**Answer:** No form defined yet. Use a placeholder (e.g., `https://docs.google.com/forms/d/FORM_ID_AQUI`) isolated in a constant/config for easy replacement later.

**Q5:** Existing Code Reuse: Are there existing features in your codebase with similar patterns we should reference?
**Answer:** Yes, follow existing patterns:
- Reuse base layout of institutional pages: Navbar, Footer, central container (max-w-..., padding, typography).
- Style should look like future `/sobre` or any content page (simple hero + text + main block).
- Reusable components: Large title (hero style), Text grid/stack with icons, Primary button with same CTA style.
- No backend needed, purely static frontend.

### Existing Code to Reference

**Similar Features Identified:**
- **Institutional Pages Layout:** Reference the layout structure used for `/sobre` or `/como-funciona` (if they exist) or the general page container pattern.
- **Components:**
    - Navbar & Footer (Global)
    - Primary Button (CTA style)
    - Typography tokens (Hero title, body text)

### Follow-up Questions
None needed. The requirements are very clear.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **New Page:** Create `/organizador` page.
- **Content Structure:**
    - **Hero/Header:** Title "Divulgue sua corrida no ProximaCorrida".
    - **Benefits Section:** Bullet points highlighting free promotion, reach, and centralization.
    - **How it Works:** 3-step visual/text guide (Fill form -> Validation -> Published).
    - **Submission Form:** Embed Google Form via `iframe` OR provide a prominent CTA button to open it externally (implement both options or a fallback).
- **Navigation:**
    - Update "ORGANIZADOR" link in Desktop Navbar.
    - Add/Update "ORGANIZADOR" link in Mobile Menu.
    - Add "Área do Organizador" link in Footer.
- **Configuration:** Store Google Form URL in a constant/config file for easy update.

### Reusability Opportunities
- **Layout:** Standard page container (`max-w-7xl`, `mx-auto`, etc.).
- **Components:** `Button` (from UI kit), Icons (Lucide React) for the "How it works" steps.
- **Styling:** TailwindCSS classes for typography and spacing consistent with the rest of the site.

### Scope Boundaries
**In Scope:**
- Frontend-only implementation of `/organizador`.
- Static content (text, icons).
- Google Form embedding/linking.
- Navigation updates.

**Out of Scope:**
- Native backend for event submission.
- Organizer login/authentication.
- Organizer dashboard.
- Automated validation of submissions (manual process for now).

### Technical Considerations
- **Responsiveness:** Ensure the iframe (if used) is responsive and doesn't break layout on mobile. Fallback to button if iframe UX is poor on small screens.
- **SEO:** Add proper metadata (title, description) for the `/organizador` page.
- **Config:** Use a dedicated file (e.g., `src/config/constants.ts` or similar) for the Form URL.
