import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
    // Get all artists that have designs
    const artists = await prisma.user.findMany({
        where: { designs: { some: { designCode: null } } }
    });

    console.log(`Found ${artists.length} artists with missing design codes.`);

    for (const artist of artists) {
        const artistNum = artist.artistNumber || 0;
        const nameParts = artist.name.trim().split(/\s+/);
        const firstInit = nameParts[0]?.charAt(0).toUpperCase() || 'X';
        const lastInit = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : 
                        (nameParts[0]?.length > 1 ? nameParts[0].charAt(1).toUpperCase() : 'X');
        
        const paddedArtistNum = artistNum.toString().padStart(3, '0');

        // Get all designs for this artist ordered by creation date
        const designs = await prisma.design.findMany({
            where: { artistId: artist.id },
            orderBy: { createdAt: 'asc' }
        });

        // Assign purely sequential numbers to ensure uniqueness
        for (let j = 0; j < designs.length; j++) {
            const design = designs[j];
            if (!design.designCode) {
                const paddedDesignNum = (j + 1).toString().padStart(3, '0');
                let designCode = `${firstInit}${lastInit}-${paddedArtistNum}-${paddedDesignNum}`;

                // Handle theoretical uniqueness collisions by appending random suffix if needed
                let isUnique = false;
                while (!isUnique) {
                    try {
                        await prisma.design.update({
                            where: { id: design.id },
                            data: { designCode }
                        });
                        isUnique = true;
                    } catch (e: any) {
                        if (e.code === 'P2002') {
                            designCode = `${designCode}-${Math.floor(Math.random() * 1000)}`;
                        } else {
                            throw e;
                        }
                    }
                }
                console.log(`Updated design ${design.id} -> ${designCode}`);
            }
        }
    }
    console.log("Backfill complete.");
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
