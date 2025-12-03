import { Controller, Post } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) { }

  @Post('trigger')
  async triggerScraping() {
    await this.scraperService.enqueueAllPlatforms();
    return { message: 'Scraping started' };
  }
}
