import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDesigns() {
    const designs = await prisma.design.findMany({
        take: 5,
        include: { artist: true }
    });
    console.log("Designs Sample:", JSON.stringify(designs, null, 2));
    const count = await prisma.design.count();
    console.log("Total Designs:", count);
}

checkDesigns();
