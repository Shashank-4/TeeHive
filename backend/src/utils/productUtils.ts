import { PrismaClient, SpecialOffer } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Fetches the active special offer if visible.
 * Currently, we only support one active special offer at a time.
 */
export const getActiveSpecialOffer = async (): Promise<SpecialOffer | null> => {
    return prisma.specialOffer.findFirst({
        where: { isVisible: true },
    });
};

/**
 * Flash sale / special offer: if the product's `categories` includes the offer's
 * `categoryName` (case-insensitive) and the offer has a positive `discountPercent`,
 * returns a reduced `price` and `originalPrice` = catalog list price (`product.price`).
 */
export const calculateProductPrice = (product: any, offer: SpecialOffer | null) => {
    const basePrice = typeof product?.price === "number" && Number.isFinite(product.price) ? product.price : 0;
    const categories = Array.isArray(product?.categories) ? product.categories : [];

    if (!offer || !offer.isVisible || !String(offer.categoryName || "").trim()) {
        return {
            price: basePrice,
            isDiscounted: false,
            discountPercent: 0,
            originalPrice: basePrice,
        };
    }

    const pct = Math.max(0, Number(offer.discountPercent) || 0);
    const offerCat = String(offer.categoryName || "").trim().toLowerCase();
    const hasCategory = categories.some(
        (cat: string) => String(cat || "").trim().toLowerCase() === offerCat
    );

    if (hasCategory && pct > 0) {
        const discountAmount = (basePrice * pct) / 100;
        const discountedPrice = Math.round(basePrice - discountAmount);
        return {
            price: discountedPrice,
            isDiscounted: true,
            discountPercent: pct,
            originalPrice: basePrice,
        };
    }

    return {
        price: basePrice,
        isDiscounted: false,
        discountPercent: 0,
        originalPrice: basePrice,
    };
};
