import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up ALL test events...');

    const { count } = await prisma.event.deleteMany({
        where: {
            OR: [
                { title: { contains: 'Test', mode: 'insensitive' } },
                { title: { contains: 'Invalid', mode: 'insensitive' } },
                { title: { contains: 'Manual', mode: 'insensitive' } },
                { sourcePlatform: 'manual' }
            ]
        }
    });

    console.log(`Deleted ${count} test events.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
