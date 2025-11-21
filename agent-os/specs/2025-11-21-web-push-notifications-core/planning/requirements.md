# Spec Requirements: Web Push Notifications (Core)

## Initial Description
Implement Service Worker + VAPID + Push API. Create backend storage for subscriptions and user preference UI for selecting states.

## Requirements Discussion

### First Round Questions

**Q1:** Subscription UI (onde o usuário ativa notificações). Bell na navbar ou outro entry point?
**Answer:** Sim, usar o ícone de “sino” (Bell) na Navbar como ponto principal.
- **Justificativas:** Padrão universal, visível, funciona em desktop/mobile, não polui a interface.
- **Comportamento (Novo Usuário):** Clicar no sino -> abre modal explicando ("Receba alertas...") -> botão "Ativar notificações" -> Browser pede permissão -> Se aceitar, abre modal de seleção de estados.
- **Comportamento (Usuário Existente):** Clicar no sino -> abre diretamente o painel de preferências (multi-select dos estados).
- **Extra:** Exibir badge (•) no sino se houver novas corridas (opcional futuro).

**Q2:** State Preferences (quando pedir as preferências). Perguntar logo ou default “All”?
**Answer:** Perguntar imediatamente após o usuário permitir push.
- **Fluxo Ideal:** Permitir -> imediatamente escolher estados -> salvar.
- **Motivo:** Evitar spam de estados irrelevantes. Default "All" é má prática de UX.

**Q3:** Database Model (Prisma). PushSubscription com endpoint, keys, statePreferences — serve?
**Answer:** Sim, exatamente isso.
- **Endpoint:** Deve ser único (evita duplicação).
- **StatePreferences:** Array de strings, atualizável via painel.
- **Auth:** Não precisa vincular a usuário (anônimo).
- **Extra:** Guardar userAgent para analytics.

**Q4:** Tech Stack (backend e frontend). NestJS + web-push + Service Worker?
**Answer:** Sim, perfeito.
- **Backend:** NestJS com biblioteca `web-push`. Gerenciar VAPID keys no .env.
- **Lógica de Envio:** Recebe (state, eventos novos) -> Busca subscribers com esse state -> Envia push payload.
- **Frontend:** Service Worker com `push` event (exibir notificação) e `notificationclick` (abrir URL).
- **Registro:** `navigator.serviceWorker.register()` no app e `PushManager.subscribe()` no modal.

**Q5:** VAPID Keys. Gerar novas? Commitar no .env?
**Answer:** Sim, gerar novas para desenvolvimento e colocar em `.env.local`.
- **Regras:** Não commitar `.env`. Chaves de produção geradas separadamente. Colocar placeholders em `.env.example`.

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions
None needed as the user provided comprehensive details.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- **Navbar Integration:** Add a "Bell" icon to the Navbar.
- **Subscription Flow:**
    - Unsubscribed user clicks Bell -> "Explainer Modal" -> "Enable" -> Browser Permission -> "Preferences Modal" -> Save.
    - Subscribed user clicks Bell -> "Preferences Modal" (to edit states).
- **Preferences:** Multi-select for Brazilian states (e.g., PB, PE, SP).
- **Push Notifications:**
    - Backend endpoint to trigger notifications based on state and event data.
    - Service Worker to handle incoming push events and display system notifications.
    - Click on notification opens the specific event URL.
- **Persistence:** Store subscriptions and preferences in a new `PushSubscription` database table.

### Reusability Opportunities
- **UI Components:** Reuse existing Modal component (if available) or create a consistent one.
- **State List:** Reuse the list of states used in the `/estados` page or filters.

### Scope Boundaries
**In Scope:**
- Service Worker registration and VAPID key generation.
- `PushSubscription` Prisma model and migration.
- Backend service for managing subscriptions and sending notifications via `web-push`.
- Frontend UI: Navbar Bell, Explainer Modal, Preferences Modal.
- Handling `push` and `notificationclick` events in SW.

**Out of Scope:**
- "I'm Going" button integration (separate feature).
- Complex analytics dashboard for push stats.
- User authentication (subscriptions are anonymous).
- Automated scraping pipeline connection (this is the "Pipeline" feature, separate from "Core").

### Technical Considerations
- **Library:** `web-push` for Node.js.
- **Keys:** VAPID keys (public/private) stored in environment variables.
- **Browser Support:** Service Workers and Push API (Chrome, Firefox, Edge, Safari on macOS/iOS 16.4+ PWA).
- **PWA:** Ensure manifest and SW are correctly configured for PWA installation (though push works on desktop web too).
