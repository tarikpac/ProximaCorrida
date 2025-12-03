import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    const url = configService.get('DATABASE_URL');
    console.log('PrismaService initializing. CWD:', process.cwd());
    console.log(
      'PrismaService initializing. DATABASE_URL from ConfigService:',
      url,
    );
    super({
      datasources: {
        db: {
          url: url,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
