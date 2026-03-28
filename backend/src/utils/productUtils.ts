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
 * Calculates the discounted price for a product based on a special offer.
 * If the product belongs to the offered category, applies the discount.
 */
export const calculateProductPrice = (product: any, offer: SpecialOffer | null) => {
    if (!offer || !offer.isVisible || !offer.categoryName) {
        return {
            price: product.price,
            isDiscounted: false,
            discountPercent: 0,
            originalPrice: product.price
        };
    }

    const hasCategory = product.categories.some(
        (cat: string) => cat.toLowerCase() === offer.categoryName.toLowerCase()
    );

    if (hasCategory) {
        const discountAmount = (product.price * offer.discountPercent) / 100;
        const discountedPrice = Math.round(product.price - discountAmount);
        return {
            price: discountedPrice,
            isDiscounted: true,
            discountPercent: offer.discountPercent,
            originalPrice: product.price
        };
    }

    return {
        price: product.price,
        isDiscounted: false,
        discountPercent: 0,
        originalPrice: product.price
    };
};
