import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillArtistNumbers() {
    console.log("Starting backfill of artist numbers...");
    const artists = await prisma.user.findMany({
        where: {
            isArtist: true,
            artistNumber: null
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    if (artists.length === 0) {
        console.log("No artists need backfilling.");
        return;
    }

    const lastArtist = await prisma.user.findFirst({
        where: { artistNumber: { not: null } },
        orderBy: { artistNumber: 'desc' }
    });

    let currentNum = (lastArtist?.artistNumber || 0) + 1;

    for (const artist of artists) {
        console.log(`Assigning number ${currentNum} to ${artist.email} (was registered at ${artist.createdAt})`);
        await prisma.user.update({
            where: { id: artist.id },
            data: { artistNumber: currentNum }
        });
        currentNum++;
    }

    console.log("Backfill complete.");
}

backfillArtistNumbers()
    .catch(err => {
        console.error("Backfill failed:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
