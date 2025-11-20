import { Controller, Post } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) { }

    @Post('trigger')
    async triggerScraping() {
        this.scraperService.scrapeEvents();
        return { message: 'Scraping started' };
    }
}
