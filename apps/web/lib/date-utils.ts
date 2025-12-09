/**
 * Date utilities for parsing and formatting dates safely
 * Handles timezone issues when dates are stored in UTC
 */

/**
 * Parse a date string to extract day, month, and year without timezone conversion
 * This is important because dates are stored as UTC (e.g., "2025-12-14T00:00:00.000Z")
 * but we want to display them as the original date (14), not converted to local time (13 in Brazil)
 */
export function parseDateSafe(dateStr: string): { day: string; month: string; monthName: string; year: string } | null {
    // Handle ISO format: "2025-12-14T00:00:00.000Z" or "2025-12-14"
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return null;
    }

    const [, year, monthNum, day] = match;
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const monthsFull = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const monthIndex = parseInt(monthNum, 10) - 1;

    return {
        day,
        month: months[monthIndex],
        monthName: monthsFull[monthIndex],
        year,
    };
}

/**
 * Format a date string to display format
 * Examples:
 *   formatDateDisplay("2025-12-14T00:00:00.000Z") => "14 DE DEZEMBRO DE 2025"
 *   formatDateDisplay("2025-12-14T00:00:00.000Z", "short") => "14 DEZ"
 */
export function formatDateDisplay(dateStr: string, format: 'full' | 'short' | 'medium' = 'full'): string {
    const parsed = parseDateSafe(dateStr);
    if (!parsed) {
        return 'Data inválida';
    }

    switch (format) {
        case 'short':
            return `${parsed.day} ${parsed.month}`;
        case 'medium':
            return `${parsed.day} DE ${parsed.monthName}`;
        case 'full':
        default:
            return `${parsed.day} DE ${parsed.monthName} DE ${parsed.year}`;
    }
}

/**
 * Get weekday name from date string
 */
export function getWeekday(dateStr: string): string {
    const parsed = parseDateSafe(dateStr);
    if (!parsed) {
        return '';
    }

    // Create date at noon to avoid timezone issues
    const date = new Date(`${parsed.year}-${String(parseInt(parsed.day)).padStart(2, '0')}-${parsed.day}T12:00:00`);
    const weekdays = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
    return weekdays[date.getDay()];
}
