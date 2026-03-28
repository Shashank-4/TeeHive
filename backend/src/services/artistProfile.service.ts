import { PrismaClient } from "@prisma/client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { r2 } from "../util/s3";

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
    const updateData: any = { ...data };

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

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

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

    if (!user.isArtist) {
        throw new Error("Only artists can submit for verification");
    }

    if (user.verificationStatus === "VERIFIED") {
        throw new Error("You are already verified");
    }

    if (user.verificationStatus === "PENDING_VERIFICATION") {
        throw new Error("Your profile is already under review");
    }

    // Validate required fields
    if (!user.displayName || !user.displayPhotoUrl) {
        throw new Error(
            "Please complete your profile: display name and display photo are required"
        );
    }

    // Validate minimum design count
    if (user.designs.length < 3) {
        throw new Error(
            `You need at least 3 designs to submit for verification. Currently you have ${user.designs.length}.`
        );
    }

    // Update status
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            verificationStatus: "PENDING_VERIFICATION",
            verificationNote: null,
            canResubmitVerification: false,
        },
    });

    const { password, ...profile } = updatedUser;
    return profile;
};
