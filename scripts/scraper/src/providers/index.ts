/**
 * Provider Registry
 * Central registration point for all provider scrapers
 */

export * from './base';

// National Provider implementations (all Brazilian states)
export { TicketSportsProvider, ticketSportsProvider } from './ticketsports';
export { MinhasInscricoesProvider, minhasInscricoesProvider } from './minhasinscricoes';
export { DoityProvider, doityProvider } from './doity';
export { SymplaProvider, symplaProvider } from './sympla';
export { ZeniteProvider, zeniteProvider } from './zenite';

// Regional Provider implementations (Nordeste only)
export { CorreParaibaProvider, correParaibaProvider } from './correparaiba';
export { Race83Provider, race83Provider } from './race83';

// Legacy Provider (fallback)
export { CorridasEMaratonasProvider, corridasEMaratonasProvider } from './corridasemaratonas';
