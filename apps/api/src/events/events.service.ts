import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Prisma } from '@prisma/client';
import { SearchEventsDto } from './dto/search-events.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        private supabase: SupabaseService,
        @InjectQueue('notifications') private notificationsQueue: Queue,
    ) { }

    // ... (other methods)

    async upsertBySourceUrl(data: Prisma.EventCreateInput) {
        const { data: existing } = await this.supabase.getClient()
            .from('Event')
            .select('id')
            .eq('sourceUrl', data.sourceUrl)
            .single();

        if (existing) {
            // Update
            const { id, ...updateData } = data as any;

            // Normalize distances
            if (updateData.distances) {
                updateData.distances = Array.from(new Set(updateData.distances.map((d: string) => this.normalizeDistance(d))));
            }

            const finalUpdateData = { ...updateData, updatedAt: new Date() };
            const { data: result, error } = await this.supabase.getClient()
                .from('Event')
                .update(finalUpdateData)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                this.logger.error(`Update failed: ${error.message}`);
                throw new Error(error.message);
            }
            return result;
        } else {
            // Insert
            const insertData = {
                ...data,
                id: crypto.randomUUID(),
                updatedAt: new Date(),
                createdAt: new Date()
            };

            // Normalize distances
            if (insertData.distances && Array.isArray(insertData.distances)) {
                insertData.distances = Array.from(new Set(insertData.distances.map((d: string) => this.normalizeDistance(d))));
            }

            const { data: result, error } = await this.supabase.getClient()
                .from('Event')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                this.logger.error(`Insert failed: ${error.message}`);
                throw new Error(error.message);
            }

            // Trigger Push Notification Job
            try {
                await this.notificationsQueue.add('send-push-notification', {
                    eventId: result.id,
                    eventTitle: result.title,
                    eventDate: result.date,
                    eventCity: result.city,
                    eventState: result.state,
                });
                this.logger.log(`Enqueued push notification for event ${result.id}`);
            } catch (queueError) {
                this.logger.error(`Failed to enqueue push notification for event ${result.id}`, queueError);
                // Don't fail the request if queueing fails
            }

            return result;
        }
    }

    async getCities(state?: string) {
        let query = this.supabase.getClient()
            .from('Event')
            .select('city');

        if (state) {
            query = query.eq('state', state);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        // Unique cities
        const cities = Array.from(new Set(data.map(e => e.city))).sort();
        return cities;
    }

    private normalizeDistance(dist: string): string {
        // Remove whitespace
        let clean = dist.trim().toLowerCase();

        // Handle "k", "km"
        clean = clean.replace(/k?m?$/i, '');

        // Handle comma/dot
        // If it has a comma, keep it if it's like 7,5. 
        // But let's standardize to "5km", "10km".
        // If it's just a number, append km.

        // Regex to extract number part
        const match = clean.match(/^(\d+(?:[.,]\d+)?)/);
        if (match) {
            let number = match[1];
            // Optional: standardize decimal separator? 
            // Let's keep it as is for now, just ensure 'km' suffix.
            return `${number}km`;
        }
        return dist; // Fallback
    }

    async normalizeAllDistances() {
        const { data: events, error } = await this.supabase.getClient()
            .from('Event')
            .select('id, distances');

        if (error) throw new Error(error.message);

        let updatedCount = 0;

        for (const event of events) {
            const originalDistances = event.distances || [];
            const newDistances = Array.from(new Set(originalDistances.map((d: string) => this.normalizeDistance(d))));

            // Check if changed
            if (JSON.stringify(originalDistances) !== JSON.stringify(newDistances)) {
                await this.supabase.getClient()
                    .from('Event')
                    .update({ distances: newDistances })
                    .eq('id', event.id);
                updatedCount++;
            }
        }

        return { message: `Normalized distances for ${updatedCount} events` };
    }

    async getEventsByStateCount() {
        const { data, error } = await this.supabase.getClient()
            .from('Event')
            .select('state');

        if (error) throw new Error(error.message);

        const counts: Record<string, number> = {};

        data.forEach((event: any) => {
            const state = event.state?.toUpperCase();
            if (state) {
                counts[state] = (counts[state] || 0) + 1;
            }
        });

        return Object.entries(counts)
            .map(([state, count]) => ({ state, count }))
            .sort((a, b) => a.state.localeCompare(b.state));
    }
}
