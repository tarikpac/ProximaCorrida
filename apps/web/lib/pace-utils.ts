export function parseTimeStringToSeconds(timeString: string): number | null {
    if (!timeString || timeString.trim() === '') return null;
    // Supports HH:MM:SS or MM:SS
    const parts = timeString.split(':').map(Number);
    if (parts.some(isNaN)) return null;

    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return null;
}

export function formatSecondsToTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60);

    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatSecondsToPace(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}`;
}

export function calculatePace(distanceKm: number, timeSeconds: number): number {
    if (distanceKm <= 0) return 0;
    return timeSeconds / distanceKm; // seconds per km
}

export function calculateTime(distanceKm: number, paceSecondsPerKm: number): number {
    return distanceKm * paceSecondsPerKm; // total seconds
}

export const STANDARD_DISTANCES = [
    { label: '5 km', km: 5 },
    { label: '10 km', km: 10 },
    { label: '15 km', km: 15 },
    { label: '21,1 km (Meia)', km: 21.0975 },
    { label: '42,2 km (Maratona)', km: 42.195 },
    { label: '50 km', km: 50 },
];
