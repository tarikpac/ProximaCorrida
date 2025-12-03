import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up specific test events...');

    const { count } = await prisma.event.deleteMany({
        where: {
            title: {
                in: ['INVALID EVENT', 'TEST EVENT EXPANSION', 'Test Event', 'Teste']
            }
        }
    });

    console.log(`Deleted ${count} specific test events.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
