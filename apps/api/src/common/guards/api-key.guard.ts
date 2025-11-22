import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.headers['x-api-key'];
        const validApiKey = process.env.INTERNAL_API_KEY;

        if (!validApiKey) {
            // If no key is configured, fail safe by blocking access
            console.error('INTERNAL_API_KEY is not set in environment variables.');
            throw new UnauthorizedException('Internal Server Configuration Error');
        }

        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API Key');
        }

        return true;
    }
}
