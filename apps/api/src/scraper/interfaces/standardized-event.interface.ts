export interface StandardizedEvent {
  title: string;
  date: Date;
  city: string | null;
  state: string | null;
  distances: string[];
  regUrl: string | null;
  sourceUrl: string;
  sourcePlatform: string;
  sourceEventId?: string | null;
  imageUrl?: string | null;
  priceText?: string | null;
  priceMin?: number | null;
  organizerName?: string | null;
  rawLocation?: string | null;
}
