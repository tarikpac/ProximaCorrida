import { Event } from '@/types/event';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getEvents(page = 1, limit = 25): Promise<Event[]> {
    const res = await fetch(`${API_URL}/events?take=${limit}&skip=${(page - 1) * limit}`, {
        next: { revalidate: 60 }, // Revalidate every minute
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
}

export async function getEvent(id: string): Promise<Event> {
    const url = `${API_URL}/events/${id}`;
    console.log(`Fetching event from: ${url}`);
    const res = await fetch(url, {
        next: { revalidate: 60 },
    });
    if (!res.ok) {
        console.error(`Failed to fetch event: ${res.status} ${res.statusText}`);
        throw new Error('Failed to fetch event');
    }
    return res.json();
}
