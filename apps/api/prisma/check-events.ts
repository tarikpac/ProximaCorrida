import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.event.count();
    console.log(`Total events in DB: ${count}`);

    const events = await prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { title: true, sourcePlatform: true, city: true, state: true }
    });
    console.log('Latest 5 events:', JSON.stringify(events, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
