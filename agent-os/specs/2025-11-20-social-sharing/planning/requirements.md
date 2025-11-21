# Spec Requirements: Social Sharing

## Initial Description
Implement a generic share button using Web Share API for mobile and a modal fallback (Copy Link, WhatsApp, Telegram) for desktop.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the primary location for the "Share" button is on the **Event Details page** (e.g., floating action button on mobile or near the title on desktop). Should we also include a smaller share icon on the **Event Cards** in the main list?
**Answer:**
- **Event Details:** Yes, primary button near title/info area (next to "Inscreva-se" or main icons).
- **Event Cards:** Yes, a smaller discrete icon (share/arrow) in the top right corner of the card for both desktop and mobile (no giant FAB on mobile to avoid pollution).

**Q2:** For the **Desktop Fallback Modal**, I'm planning to include Copy Link, WhatsApp, Telegram. Should we include any other platforms?
**Answer:** Yes, include **Twitter/X** and **Facebook**.
- **Structure:** Title "Compartilhar corrida", Buttons: Copy Link (Primary), WhatsApp Web, Telegram Web, X (Twitter), Facebook.

**Q3:** When sharing via the **Web Share API (Mobile)**, I plan to populate the share data with Title, Text, URL. Does this content structure look good to you?
**Answer:** Yes.
- **Format:**
  - **Title:** [Event Name]
  - **Text:** "Confira este evento no ProximaCorrida: [Event Name] em [City/State] no dia [Date]." (If City/State missing, use just Date + Name).
  - **URL:** Direct link to event page.

**Q4:** For the **Share Button Design**, should it be a prominent floating button (FAB) on mobile to encourage sharing, or just a standard icon button in the header/info area?
**Answer:** **Standard icon/button**, NOT a FAB for MVP.
- **Event Details:** Icon/button in header/info area aligned with current design.
- **Event Card:** Smaller icon, easy to find but not dominant.

### Existing Code to Reference

**Similar Features Identified:**
- No generic Modal or Toast currently exists.
- **Action Required:**
  - Create a reusable **BaseModal** (or ShareModal) component.
  - Create a simple **Toast** system (e.g., `useToast` hook + `<ToastContainer />`) for "Link Copied!" feedback.

### Follow-up Questions
None needed. The requirements are clear and specific.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Web Share API Integration:** trigger native sharing on supported mobile browsers.
- **Fallback Modal (Desktop/Unsupported):**
  - Display options: Copy Link, WhatsApp, Telegram, Twitter/X, Facebook.
  - "Copy Link" must copy URL to clipboard and trigger a Toast.
- **UI Placement:**
  - **Event Details Page:** Prominent button/icon in the info header area.
  - **Event Cards:** Discrete share icon in the top-right corner.
- **Share Content:** Standardized message format including Event Name, City/State, Date, and URL.

### Reusability Opportunities
- **New Components:**
  - `Modal` (Generic reusable base)
  - `Toast` (Generic notification system)
  - `ShareButton` (Logic wrapper to handle Web Share vs Modal toggle)

### Scope Boundaries
**In Scope:**
- Implementation of Share logic (Web Share API + Fallback).
- Creation of Modal and Toast components.
- Integration into Event Details and Event Cards.

**Out of Scope:**
- Floating Action Button (FAB) implementation.
- Social media meta tag optimization (OG Tags) - *Note: This might be needed for the links to look good on social media, but wasn't explicitly requested as part of the "Share Button" task, though it's good practice.*

### Technical Considerations
- **Clipboard API:** Use `navigator.clipboard.writeText` for the "Copy Link" feature.
- **Platform Detection:** Logic to detect if `navigator.share` is available to decide between Native Share or Modal.
- **WhatsApp/Telegram Links:** Use `wa.me` or `web.whatsapp.com` and `t.me` URL schemes with pre-filled text.
