import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { Prisma } from '@prisma/client';
import { SearchEventsDto } from './dto/search-events.dto';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    create(@Body() createEventDto: Prisma.EventCreateInput) {
        return this.eventsService.create(createEventDto);
    }

    @Get()
    findAll(@Query() query: SearchEventsDto) {
        return this.eventsService.findAll(query);
    }

    @Get('stats/by-state')
    getEventsByStateCount() {
        return this.eventsService.getEventsByStateCount();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.eventsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateEventDto: Prisma.EventUpdateInput) {
        return this.eventsService.update(id, updateEventDto);
    }

    @Get('cities')
    getCities(@Query('state') state?: string) {
        return this.eventsService.getCities(state);
    }

    @Post('normalize-distances')
    normalizeDistances() {
        return this.eventsService.normalizeAllDistances();
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.eventsService.remove(id);
    }
}
