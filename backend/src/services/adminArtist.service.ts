import { PrismaClient, VerificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * List artists filtered by verification status, with pagination
 */
export const listArtistsService = async (options: {
    status?: VerificationStatus;
    page?: number;
    limit?: number;
    search?: string;
}) => {
    const { status, page = 1, limit = 20, search } = options;

    const where: any = {
        isArtist: true,
    };

    if (status) {
        where.verificationStatus = status;
    }

    if (search) {
        const searchNum = parseInt(search, 10);
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
        ];
        if (!isNaN(searchNum)) {
            where.OR.push({ artistNumber: searchNum });
        }
    }

    const [artists, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                displayName: true,
                artistNumber: true,
                displayPhotoUrl: true,
                verificationStatus: true,
                createdAt: true,
                _count: {
                    select: {
                        designs: {
                            where: { isDeleted: false },
                        },
                        products: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.user.count({ where }),
    ]);

    return {
        artists,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get detailed artist profile with all designs (for admin review)
 */
export const getArtistDetailService = async (artistId: string) => {
    const artist = await prisma.user.findUnique({
        where: { id: artistId },
        select: {
            id: true,
            name: true,
            email: true,
            displayName: true,
            artistNumber: true,
            bio: true,
            displayPhotoUrl: true,
            coverPhotoUrl: true,
            portfolioUrl: true,
            instagramUrl: true,
            twitterUrl: true,
            behanceUrl: true,
            dribbbleUrl: true,
            verificationStatus: true,
            verificationNote: true,
            canResubmitVerification: true,
            verifiedAt: true,
            isArtist: true,
            createdAt: true,
            updatedAt: true,
            designs: {
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: {
                    products: true,
                },
            },
        },
    });

    if (!artist || !artist.isArtist) {
        throw new Error("Artist not found");
    }

    return artist;
};

/**
 * Approve or reject an artist
 */
export const verifyArtistService = async (
    artistId: string,
    action: "APPROVE" | "REJECT",
    reason?: string,
    canResubmitVerification?: boolean
) => {
    const artist = await prisma.user.findUnique({
        where: { id: artistId },
    });

    if (!artist || !artist.isArtist) {
        throw new Error("Artist not found");
    }

    if (action === "APPROVE") {
        // Approve the artist
        const updatedArtist = await prisma.user.update({
            where: { id: artistId },
            data: {
                verificationStatus: "VERIFIED",
                verificationNote: null,
                canResubmitVerification: false,
                verifiedAt: new Date(),
            },
        });

        // Auto-approve all pending designs for this artist
        await prisma.design.updateMany({
            where: {
                artistId: artistId,
                status: "PENDING",
                isDeleted: false,
            },
            data: {
                status: "APPROVED",
            },
        });

        const { password, ...profile } = updatedArtist;
        return profile;
    } else {
        // Reject the artist
        if (!reason) {
            throw new Error("A rejection reason is required");
        }

        const updatedArtist = await prisma.user.update({
            where: { id: artistId },
            data: {
                verificationStatus: "REJECTED",
                verificationNote: reason,
                canResubmitVerification: canResubmitVerification || false,
                verifiedAt: null,
            },
        });

        const { password, ...profile } = updatedArtist;
        return profile;
    }
};

/**
 * Toggle allowing a rejected artist to resubmit verification
 */
export const toggleResubmissionService = async (
    artistId: string,
    canResubmit: boolean
) => {
    const artist = await prisma.user.findUnique({
        where: { id: artistId },
    });

    if (!artist || !artist.isArtist) {
        throw new Error("Artist not found");
    }

    const updatedArtist = await prisma.user.update({
        where: { id: artistId },
        data: {
            canResubmitVerification: canResubmit,
        },
    });

    const { password, ...profile } = updatedArtist;
    return profile;
};

/**
 * Manually reject a single design (admin can do this even after artist is verified)
 */
export const rejectDesignService = async (
    designId: string,
    reason: string
) => {
    const design = await prisma.design.findUnique({
        where: { id: designId },
    });

    if (!design) {
        throw new Error("Design not found");
    }

    const updatedDesign = await prisma.design.update({
        where: { id: designId },
        data: {
            status: "REJECTED",
            rejectionReason: reason,
            isRejected: true,
        },
        include: {
            artist: { select: { email: true, name: true, displayName: true } }
        }
    });

    return updatedDesign;
};
