# Specification: Social Sharing

## Goal
Implement a generic sharing mechanism that uses the native Web Share API on mobile devices and falls back to a custom modal with social media links (WhatsApp, Telegram, X, Facebook, Copy Link) on desktop or unsupported browsers.

## User Stories
- As a user, I want to easily share an event I found on ProximaCorrida with my friends via WhatsApp or other apps so we can sign up together.
- As a desktop user, I want to quickly copy the event link or open it in WhatsApp Web without needing to manually copy-paste the URL.
- As a user browsing the event list, I want a quick way to share an event directly from the card without opening the details page.

## Specific Requirements

**Share Logic & API**
- Implement a `shareEvent(eventData)` utility function.
- Check for `navigator.share` support.
- If supported (Mobile), trigger native share with `title`, `text`, and `url`.
- If unsupported (Desktop), open the **Share Modal**.

**Share Modal (Desktop Fallback)**
- Create a reusable `ShareModal` component.
- Display title "Compartilhar corrida".
- Show buttons for:
  - **Copy Link** (Primary action, copies to clipboard)
  - **WhatsApp** (Opens `https://wa.me/?text=...`)
  - **Telegram** (Opens `https://t.me/share/url?url=...&text=...`)
  - **X / Twitter** (Opens `https://twitter.com/intent/tweet?text=...&url=...`)
  - **Facebook** (Opens `https://www.facebook.com/sharer/sharer.php?u=...`)
- Close modal on backdrop click or "X" button.

**Toast Notification**
- Create a simple `Toast` system (Context + Hook) to show feedback.
- Trigger "Link copiado!" toast when the user clicks "Copy Link" in the modal.
- Toast should auto-dismiss after ~3 seconds.

**UI Integration**
- **Event Details Page:** Add a prominent Share button/icon in the header info area (next to "Inscreva-se" or similar).
- **Event Cards:** Add a small, discrete Share icon in the top-right corner of the card.
- Ensure buttons are touch-friendly but not obtrusive (no FAB).

**Share Content Format**
- **Title:** Event Name
- **Text:** "Confira este evento no ProximaCorrida: [Event Name] em [City/State] no dia [Date]."
- **URL:** Absolute URL to the event details page.

## Visual Design
*No visual assets provided. Follow existing design system.*

**UI Guidelines**
- Use `lucide-react` icons: `Share2` or `Share` for the button.
- Modal: Clean, centered, white background (dark in dark mode), rounded corners, shadow.
- Buttons in Modal: Can use brand colors (Green for WhatsApp, Blue for Telegram/FB) or neutral with icons.
- Toast: Fixed position (bottom-center or top-center), black background/white text, subtle animation.

## Existing Code to Leverage

**Icons**
- `lucide-react` is already installed. Use `Share2` icon for consistency.

**Styling**
- Use Tailwind CSS utility classes for all new components (`fixed`, `inset-0`, `z-50`, `bg-black/50`, etc. for modal).

**Project Structure**
- Place reusable UI components in `apps/web/components/ui/` (`modal.tsx`, `toast.tsx`).
- Place feature-specific logic/components in `apps/web/components/share/` if complex, or directly in `ui` if generic.

## Out of Scope
- Floating Action Button (FAB) for mobile.
- Open Graph (OG) Meta Tags customization (handled separately).
- Email sharing option.
- Tracking/Analytics of share events (nice to have, but not MVP).
