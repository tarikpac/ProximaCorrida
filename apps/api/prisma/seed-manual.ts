import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const event = await prisma.event.create({
        data: {
            title: 'Corrida Teste Manual',
            date: new Date('2025-12-31T08:00:00Z'),
            city: 'João Pessoa',
            state: 'PB',
            distances: ['5km', '10km'],
            regLink: 'http://example.com',
            sourceUrl: 'http://example.com/manual-test',
            sourcePlatform: 'manual',
            sourceEventId: 'manual-1',
            priceText: 'R$ 50,00',
            priceMin: 50.00,
        },
    });

    console.log('Created event:', event);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
