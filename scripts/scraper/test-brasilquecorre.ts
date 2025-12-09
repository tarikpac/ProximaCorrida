/**
 * Test script for BrasilQueCorre provider
 */

import { chromium } from 'playwright';
import { BrasilQueCorreProvider } from './src/providers/brasilquecorre';

async function testBrasilQueCorre() {
    console.log('=== Testing BrasilQueCorre Provider ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    try {
        const provider = new BrasilQueCorreProvider();

        const options = {
            detailTimeoutMs: 15000,
            registrationTimeoutMs: 20000,
            regTimeoutMs: 20000,
            eventDelayMs: 300,
            stalenessDays: 7,
            shouldLogDebug: true,
        };

        // Test with PB and DF
        console.log('Testing with PB and DF...');
        const result = await provider.scrape(context, options, ['PB', 'DF']);

        console.log(`\nResults for PB:`);
        console.log(`  Events found: ${result.events.length}`);
        console.log(`  Stats: ${JSON.stringify(result.stats)}`);

        console.log('\nFirst 5 events:');
        result.events.slice(0, 5).forEach((event, i) => {
            console.log(`  ${i + 1}. ${event.title}`);
            console.log(`     Date: ${event.date.toISOString().split('T')[0]}`);
            console.log(`     City: ${event.city}, ${event.state}`);
            console.log(`     Distances: ${event.distances.join(', ')}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

testBrasilQueCorre();
