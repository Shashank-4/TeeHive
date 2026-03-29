import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.user.updateMany({
        data: {
            isAdmin: true,
            isArtist: true,
            verificationStatus: 'VERIFIED'
        }
    });
    console.log(`Updated ${result.count} users to be admin and verified artists.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
