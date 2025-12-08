import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Prisma } from '@prisma/client';
import { SearchEventsDto } from './dto/search-events.dto';
import { StandardizedEvent } from '../scraper/interfaces/standardized-event.interface';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * EventsService - Handles CRUD operations for running events.
 * 
 * NOTE: Push notifications are now sent inline (synchronously) instead of
 * being queued via BullMQ. This was done for Lambda compatibility.
 * 
 * If notification volume increases significantly, consider:
 * - AWS SQS + Lambda trigger for async processing
 * - Or reintroduce BullMQ with a separate worker
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private supabase: SupabaseService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  async create(data: Prisma.EventCreateInput) {
    // Use Prisma for create to ensure permissions
    const result = await this.prisma.event.create({
      data: {
        ...data,
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    });
    return result;
  }

  async findAll(query: SearchEventsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    if (query.state) {
      where.state = query.state;
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.from) {
      where.date = { ...(where.date as Prisma.DateTimeFilter), gte: query.from };
    }

    if (query.to) {
      where.date = { ...(where.date as Prisma.DateTimeFilter), lte: query.to };
    }

    if (query.query) {
      where.title = { contains: query.query, mode: 'insensitive' };
    }

    if (query.distances && query.distances.length > 0) {
      where.distances = { hasSome: query.distances };
    }

    // Default Filter: Active Events Only (unless specified otherwise in future)
    // Enforce that we only show active events by default
    where.isActive = true;

    // Default Filter: Upcoming/Today events (hide past events from default list)
    // If explicit date range provided (from/to), we respect that (and query.from logic above handles it).
    // If NO date range provided, we default to "From Today onwards".
    if (!query.from && !query.to && !query.query) {
      // Just to be safe, we filter >= today (00:00 BRT)
      // This effectively hides "yesterday's" races if they weren't archived yet.
      const todayStart = this.getTodayStartBRT();
      where.date = { ...(where.date as Prisma.DateTimeFilter), gte: todayStart };
    }

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!data) throw new Error('Event not found');
    return data;
  }

  async update(id: string, data: Prisma.EventUpdateInput) {
    // Use Prisma for update
    const result = await this.prisma.event.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
    return result;
  }

  async remove(id: string) {
    // Use Prisma for delete
    await this.prisma.event.delete({
      where: { id },
    });
    return { message: 'Event deleted successfully' };
  }

  async upsertBySourceUrl(data: Prisma.EventCreateInput) {
    const existing = await this.prisma.event.findUnique({
      where: { sourceUrl: data.sourceUrl },
    });

    if (existing) {
      // Update
      const { id, ...updateData } = data as any;

      // Normalize distances
      if (updateData.distances) {
        updateData.distances = Array.from(
          new Set(
            updateData.distances.map((d: string) => this.normalizeDistance(d)),
          ),
        );
      }

      const finalUpdateData = { ...updateData, updatedAt: new Date() };
      const result = await this.prisma.event.update({
        where: { id: existing.id },
        data: finalUpdateData,
      });
      return result;
    } else {
      // Insert
      const insertData = {
        ...data,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      // Normalize distances
      if (insertData.distances && Array.isArray(insertData.distances)) {
        insertData.distances = Array.from(
          new Set(
            insertData.distances.map((d: string) => this.normalizeDistance(d)),
          ),
        );
      }

      const result = await this.prisma.event.create({
        data: insertData as any,
      });

      // Send Push Notification inline (fire-and-forget, don't block the response)
      this.sendPushNotificationAsync(result.id, result.title, result.state);

      return result;
    }
  }

  async getCities(state?: string) {
    const where: Prisma.EventWhereInput = {};
    if (state) {
      where.state = state;
    }

    const events = await this.prisma.event.findMany({
      where,
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });

    return events.map((e) => e.city);
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
      const number = match[1];
      // Optional: standardize decimal separator?
      // Let's keep it as is for now, just ensure 'km' suffix.
      return `${number}km`;
    }
    return dist; // Fallback
  }

  async normalizeAllDistances() {
    const events = await this.prisma.event.findMany({
      select: { id: true, distances: true },
    });

    let updatedCount = 0;

    for (const event of events) {
      const originalDistances = event.distances || [];
      const newDistances = Array.from(
        new Set(
          originalDistances.map((d: string) => this.normalizeDistance(d)),
        ),
      );

      // Check if changed
      if (JSON.stringify(originalDistances) !== JSON.stringify(newDistances)) {
        await this.prisma.event.update({
          where: { id: event.id },
          data: { distances: newDistances },
        });
        updatedCount++;
      }
    }

    return { message: `Normalized distances for ${updatedCount} events` };
  }

  async getEventsByStateCount() {
    const events = await this.prisma.event.groupBy({
      by: ['state'],
      _count: {
        state: true,
      },
    });

    return events
      .map((e) => ({
        state: e.state,
        count: e._count.state,
      }))
      .sort((a, b) => a.state.localeCompare(b.state));
  }

  async upsertFromStandardized(evt: StandardizedEvent) {
    // Deduplication logic using Prisma
    let existing = null;

    if (evt.sourceEventId) {
      existing = await this.prisma.event.findFirst({
        where: {
          sourcePlatform: evt.sourcePlatform,
          sourceEventId: evt.sourceEventId,
        },
      });
    }

    if (!existing) {
      existing = await this.prisma.event.findFirst({
        where: {
          sourcePlatform: evt.sourcePlatform,
          sourceUrl: evt.sourceUrl,
        },
      });
    }

    // Prepare data
    const eventData: any = {
      title: evt.title,
      date: evt.date,
      city: evt.city || 'Unknown',
      state: evt.state || 'PB',
      distances: evt.distances,
      regLink: evt.regUrl || '',
      sourceUrl: evt.sourceUrl,
      imageUrl: evt.imageUrl,
      price: evt.priceText || 'Sob Consulta', // Map priceText to price (legacy field)
      // New fields
      sourcePlatform: evt.sourcePlatform,
      sourceEventId: evt.sourceEventId,
      rawLocation: evt.rawLocation,
      priceText: evt.priceText,
      priceMin: evt.priceMin,
      updatedAt: new Date(),
    };

    // Normalize distances
    if (eventData.distances) {
      eventData.distances = Array.from(
        new Set(
          eventData.distances.map((d: string) => this.normalizeDistance(d)),
        ),
      );
    }

    if (existing) {
      // Update
      const result = await this.prisma.event.update({
        where: { id: existing.id },
        data: eventData,
      });
      return result;
    } else {
      // Insert
      const insertData = {
        ...eventData,
        createdAt: new Date(),
      };

      const result = await this.prisma.event.create({
        data: insertData,
      });

      // Send Push Notification inline (fire-and-forget, don't block the response)
      this.sendPushNotificationAsync(result.id, result.title, result.state);

      return result;
    }
  }


  async archivePastEvents() {
    const todayStart = this.getTodayStartBRT();
    this.logger.log(`Archiving events before ${todayStart.toISOString()} (Star of Today in BRT)`);

    const result = await this.prisma.event.updateMany({
      where: {
        isActive: true,
        date: {
          lt: todayStart,
        },
      },
      data: {
        isActive: false,
        archivedAt: new Date(),
      },
    });

    this.logger.log(`Archived ${result.count} past events.`);
    return result;
  }

  private getTodayStartBRT(): Date {
    // Current time
    const now = new Date();

    // Get date parts in BRT
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // parts format is usually MM/DD/YYYY or similar depending on locale, but formatToParts is safer
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    if (!year || !month || !day) {
      // Fallback to strict UTC if something fails, though unlikely
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }

    // Create string YYYY-MM-DD
    const dateStr = `${year}-${month}-${day}T00:00:00.000`; // Local wall time

    // We need to convert this "Wall Time" 00:00 to the actual Date object representing that instant.
    // Since we want 00:00 BRT, and BRT is -03:00.
    // We can construct the ISO string with offset.
    const isoWithOffset = `${year}-${month}-${day}T00:00:00.000-03:00`;

    return new Date(isoWithOffset);
  }

  /**
   * Check which events from the provided list are "fresh" and don't need re-scraping.
   * An event is considered fresh if it exists in the database AND its updatedAt
   * is within the staleness threshold.
   *
   * @param sourceUrls List of source URLs to check
   * @param stalenessDays Number of days after which an event is considered stale
   * @returns Set of sourceUrls that are fresh (should be skipped)
   */
  async checkEventsFreshness(
    sourceUrls: string[],
    stalenessDays: number,
  ): Promise<Set<string>> {
    if (sourceUrls.length === 0) {
      return new Set();
    }

    // Calculate the staleness threshold date
    const stalenessThreshold = new Date();
    stalenessThreshold.setDate(stalenessThreshold.getDate() - stalenessDays);

    // Batch query: find all events with the given sourceUrls that are fresh
    const freshEvents = await this.prisma.event.findMany({
      where: {
        sourceUrl: { in: sourceUrls },
        updatedAt: { gte: stalenessThreshold },
      },
      select: { sourceUrl: true },
    });

    // Return as a Set for O(1) lookup
    return new Set(freshEvents.map((e) => e.sourceUrl));
  }

  /**
   * Send push notification asynchronously (fire-and-forget).
   * This doesn't block the response and logs any errors.
   */
  private sendPushNotificationAsync(
    eventId: string,
    eventTitle: string,
    eventState: string,
  ): void {
    // Fire and forget - don't await
    this.notificationsService
      .triggerEventNotification(eventId, eventTitle, eventState)
      .then((result) => {
        this.logger.log(
          `Push notification sent for event ${eventId}: sent=${result.sent}, failed=${result.failed}`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `Failed to send push notification for event ${eventId}`,
          error,
        );
      });
  }
}
