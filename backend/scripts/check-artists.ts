import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkArtists() {
    const artists = await prisma.user.findMany({
        where: { isArtist: true },
        select: { email: true, artistNumber: true }
    });
    console.log(JSON.stringify(artists, null, 2));
}

checkArtists()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
