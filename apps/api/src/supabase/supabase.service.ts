import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;
    private readonly logger = new Logger(SupabaseService.name);

    constructor(private configService: ConfigService) {
        const supabaseUrl = 'https://acylcvqgvqyrdrpmpeqk.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjeWxjdnFndnF5cmRycG1wZXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTQzMzIsImV4cCI6MjA3OTEzMDMzMn0.E0YWRxNe5onWfQgo42RHrggEaN4klmtwa-oARoQ9Y1A';

        if (!supabaseUrl || !supabaseKey) {
            this.logger.error('Supabase URL or Key is missing!');
            throw new Error('Supabase credentials missing');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }
}
