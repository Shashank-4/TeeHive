import { PrismaClient, Prisma } from "@prisma/client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { r2 } from "../util/s3";
import {
    isReservedArtistSlug,
    isValidArtistSlugFormat,
    normalizeArtistSlug,
} from "../utils/artistSlug";

const prisma = new PrismaClient();

const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL!;

/**
 * Upload a file (display photo / cover photo) to R2
 */
export const uploadProfileImageToR2 = async (
    file: Express.Multer.File,
    userId: string,
    type: "display" | "cover"
) => {
    if (!file.mimetype.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed.");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 5MB.");
    }

    const fileExtension = file.mimetype.split("/")[1] || "jpg";
    const timestamp = Date.now();
    const randomId = nanoid(10);
    const fileKey = `profiles/${userId}/${type}-${timestamp}-${randomId}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await r2.send(command);

    const imageUrl = `${PUBLIC_URL}/${fileKey}`;
    return { imageUrl, fileKey };
};

/**
 * Delete a file from R2
 */
export const deleteFileFromR2 = async (fileKey: string) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });
        await r2.send(command);
    } catch (err) {
        console.error("[R2] Failed to delete file:", fileKey, err);
    }
};

/**
 * Get the current artist's profile
 */
export const getArtistProfileService = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            designs: {
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const { password, ...profile } = user;
    return profile;
};

/**
 * Update artist profile fields + optionally replace photos
 */
export const updateArtistProfileService = async (
    userId: string,
    data: {
        displayName?: string;
        artistSlug?: string;
        bio?: string;
        portfolioUrl?: string;
        instagramUrl?: string;
        twitterUrl?: string;
        behanceUrl?: string;
        dribbbleUrl?: string;
    },
    displayPhoto?: Express.Multer.File,
    coverPhoto?: Express.Multer.File
) => {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.displayName !== undefined) {
        const dn = String(data.displayName).trim();
        if (!dn) {
            throw new Error("Display name cannot be empty");
        }
        if (dn.length > 80) {
            throw new Error("Display name must be 80 characters or less");
        }
        updateData.displayName = dn;
    }

    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.portfolioUrl !== undefined) updateData.portfolioUrl = data.portfolioUrl || null;
    if (data.instagramUrl !== undefined) updateData.instagramUrl = data.instagramUrl || null;
    if (data.twitterUrl !== undefined) updateData.twitterUrl = data.twitterUrl || null;
    if (data.behanceUrl !== undefined) updateData.behanceUrl = data.behanceUrl || null;
    if (data.dribbbleUrl !== undefined) updateData.dribbbleUrl = data.dribbbleUrl || null;

    if (data.artistSlug !== undefined) {
        const raw = String(data.artistSlug).trim();
        if (!raw) {
            throw new Error("Storefront handle cannot be empty");
        }
        if (!isValidArtistSlugFormat(raw)) {
            throw new Error(
                "Handle must be 2–32 characters: letters, numbers, and single hyphens only"
            );
        }
        const slug = normalizeArtistSlug(raw);
        if (isReservedArtistSlug(slug)) {
            throw new Error("This handle is reserved; please choose another");
        }
        const taken = await prisma.user.findFirst({
            where: {
                artistSlug: { equals: slug, mode: "insensitive" },
                id: { not: userId },
            },
            select: { id: true },
        });
        if (taken) {
            throw new Error("This storefront handle is already taken");
        }
        updateData.artistSlug = slug;
    }

    // Handle display photo upload
    if (displayPhoto) {
        // Delete old photo from R2 if exists
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (currentUser?.displayPhotoKey) {
            await deleteFileFromR2(currentUser.displayPhotoKey);
        }

        const { imageUrl, fileKey } = await uploadProfileImageToR2(
            displayPhoto,
            userId,
            "display"
        );
        updateData.displayPhotoUrl = imageUrl;
        updateData.displayPhotoKey = fileKey;
    }

    // Handle cover photo upload
    if (coverPhoto) {
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (currentUser?.coverPhotoKey) {
            await deleteFileFromR2(currentUser.coverPhotoKey);
        }

        const { imageUrl, fileKey } = await uploadProfileImageToR2(
            coverPhoto,
            userId,
            "cover"
        );
        updateData.coverPhotoUrl = imageUrl;
        updateData.coverPhotoKey = fileKey;
    }

    let updatedUser;
    try {
        updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
    } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            const targets = (e.meta?.target as string[]) || [];
            if (targets.includes("displayName")) {
                throw new Error("This display name is already taken");
            }
            if (targets.includes("artistSlug")) {
                throw new Error("This storefront handle is already taken");
            }
            throw new Error("A unique profile field conflicts with an existing account");
        }
        throw e;
    }

    const { password, ...profile } = updatedUser;
    return profile;
};

/**
 * Submit artist profile for verification.
 * Validates: ≥3 designs uploaded, display name + display photo set.
 */
export const submitForVerificationService = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            designs: {
                where: { isDeleted: false },
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (user.isArtist && user.verificationStatus === "VERIFIED") {
        throw new Error("You are already verified");
    }

    if (user.verificationStatus === "VERIFIED") {
        throw new Error("You are already verified");
    }

    // Removed pending verification check as we instantly verify now

    // Validate required fields
    if (!user.displayName || !user.displayPhotoUrl) {
        throw new Error(
            "Please complete your profile: display name and display photo are required"
        );
    }

    if (!user.artistSlug || !String(user.artistSlug).trim()) {
        throw new Error(
            "Please set a unique storefront handle (your public profile URL) before continuing"
        );
    }

    // Removed minimum design count validation

    // Update status to activated
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            verificationStatus: "VERIFIED",
            verificationNote: null,
            canResubmitVerification: false,
            isArtist: true,
            verifiedAt: new Date(),
        },
    });

    const { password, ...profile } = updatedUser;
    return profile;
};
