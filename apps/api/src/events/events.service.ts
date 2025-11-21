import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Prisma } from '@prisma/client';
import { SearchEventsDto } from './dto/search-events.dto';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(private supabase: SupabaseService) { }

    async create(data: Prisma.EventCreateInput) {
        const { data: result, error } = await this.supabase.getClient()
            .from('Event')
            .insert(data)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return result;
    }

    async findAll(params: SearchEventsDto) {
        let query = this.supabase.getClient().from('Event').select('*', { count: 'exact' });

        if (params.state) {
            query = query.ilike('state', params.state);
        }

        if (params.city) {
            query = query.ilike('city', `%${params.city}%`);
        }

        if (params.from) {
            query = query.gte('date', params.from);
        }

        if (params.to) {
            query = query.lte('date', params.to);
        }

        if (params.distances && params.distances.length > 0) {
            const distancesArray = `{${params.distances.join(',')}}`;
            query = query.filter('distances', 'ov', distancesArray);
        }

        if (params.query) {
            const search = `%${params.query}%`;
            query = query.or(`title.ilike.${search},city.ilike.${search},organizer.ilike.${search}`);
        }

        let data: any[] = [];
        let count = 0;
        let error = null;

        // If types filter is present, we must filter in memory because we don't have a structured types column
        // and the logic involves checking titles and distances in complex ways.
        if (params.types && params.types.length > 0) {
            this.logger.log(`Filtering in memory for types: ${JSON.stringify(params.types)}`);

            // Fetch all matches for other filters (ordered by date)
            query = query.order('date', { ascending: true });
            const result = await query;

            if (result.error) throw new Error(result.error.message);

            let filteredData = result.data || [];
            const initialCount = filteredData.length;

            filteredData = filteredData.filter(event => {
                const title = event.title.toLowerCase();
                const distances = (event.distances || []).map((d: string) => d.toLowerCase());

                // Check if event matches ANY of the selected types
                const match = params.types?.some(type => {
                    const t = type.toLowerCase();
                    if (t === 'trail') {
                        return title.includes('trail') || distances.some((d: string) => d.includes('trail'));
                    }
                    if (t === 'caminhada') {
                        return title.includes('caminhada') || distances.some((d: string) => d.includes('caminhada'));
                    }
                    if (t === 'ultramaratona') {
                        const isUltraDist = distances.some((d: string) => {
                            const match = d.match(/(\d+)/);
                            return match && parseInt(match[1]) > 42;
                        });
                        return title.includes('ultra') || isUltraDist;
                    }
                    if (t === 'rua') {
                        // Rua matches if it is NOT Trail, NOT Caminhada, NOT Ultra
                        const isTrail = title.includes('trail') || distances.some((d: string) => d.includes('trail'));
                        const isCaminhada = title.includes('caminhada') || distances.some((d: string) => d.includes('caminhada'));
                        const isUltra = title.includes('ultra') || distances.some((d: string) => {
                            const match = d.match(/(\d+)/);
                            return match && parseInt(match[1]) > 42;
                        });

                        return !isTrail && !isCaminhada && !isUltra;
                    }
                    return title.includes(t);
                });
                return match || false;
            });

            this.logger.log(`Filtered from ${initialCount} to ${filteredData.length} events`);

            count = filteredData.length;

            // Apply pagination in memory
            const page = params.page || 1;
            const limit = params.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit;
            data = filteredData.slice(from, to);

        } else {
            // Standard DB pagination
            const page = params.page || 1;
            const limit = params.limit || 10;
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            query = query.range(from, to);
            query = query.order('date', { ascending: true });

            const result = await query;
            if (result.error) throw new Error(result.error.message);

            data = result.data || [];
            count = result.count || 0;
        }

        this.logger.log(`findAll params: ${JSON.stringify(params)}`);
        if (params.distances) {
            this.logger.log(`Filtering by distances: ${JSON.stringify(params.distances)}`);
        }

        this.logger.log(`Query result count: ${count}`);
        if (data && data.length > 0) {
            this.logger.log(`First event distances: ${JSON.stringify(data[0].distances)}`);
        }
        if (data && data.length === 0) this.logger.warn(`No data found for params: ${JSON.stringify(params)}`);

        const page = params.page || 1;
        const limit = params.limit || 10;

        return {
            data,
            meta: {
                total: count,
                page,
                limit,
                last_page: Math.ceil((count || 0) / limit),
                debug_params: params
            }
        };
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase.getClient()
            .from('Event')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async update(id: string, data: Prisma.EventUpdateInput) {
        const { data: result, error } = await this.supabase.getClient()
            .from('Event')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return result;
    }

    async remove(id: string) {
        const { error } = await this.supabase.getClient()
            .from('Event')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { deleted: true };
    }

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
