import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type PricingProtocolsConfig = {
    protocols?: Array<{
        category: string;
        frontOnly?: number;
        backOnly?: number;
        bothSides?: number;
    }>;
};

/**
 * When admin saves pricing protocols, align catalog `Product.price` with the T-Shirt
 * tier rules (same heuristic as the artist mockup creator: back mockup present → bothSides).
 * The back-only tier is not inferred from the DB (rare); override those SKUs in Admin → Stockpile.
 */
export async function syncCatalogPricesFromPricingProtocols(
    configValue: unknown
): Promise<{ updated: number; skippedReason?: string }> {
    const cfg = configValue as PricingProtocolsConfig;
    const protocols = cfg?.protocols;
    if (!Array.isArray(protocols) || protocols.length === 0) {
        return { updated: 0, skippedReason: "no_protocols" };
    }

    const tshirt = protocols.find((p) => p.category === "T-Shirt");
    if (!tshirt) {
        return { updated: 0, skippedReason: "no_t_shirt_protocol" };
    }

    const frontOnly = Math.max(0, Math.floor(Number(tshirt.frontOnly) || 0));
    const bothSides = Math.max(0, Math.floor(Number(tshirt.bothSides) || 0));

    const products = await prisma.product.findMany({
        where: { status: { in: ["PUBLISHED", "DRAFT"] } },
        select: { id: true, backMockupImageUrl: true },
    });

    let updated = 0;
    for (const p of products) {
        const hasBack = Boolean(p.backMockupImageUrl && String(p.backMockupImageUrl).trim());
        const newPrice = hasBack ? bothSides : frontOnly;
        await prisma.product.update({
            where: { id: p.id },
            data: { price: newPrice },
        });
        updated += 1;
    }

    return { updated };
}
