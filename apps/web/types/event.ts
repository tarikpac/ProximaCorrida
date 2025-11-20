export interface Event {
    id: string;
    title: string;
    date: string;
    city: string;
    state: string;
    distances: string[];
    location?: string;
    organizer?: string;
    imageUrl?: string;
    price?: string;
    regLink: string;
    sourceUrl: string;
}
