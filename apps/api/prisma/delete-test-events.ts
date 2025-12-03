import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up test events...');

    const { count } = await prisma.event.deleteMany({
        where: {
            OR: [
                { sourcePlatform: 'manual' },
                { title: { contains: 'Teste', mode: 'insensitive' } }
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
