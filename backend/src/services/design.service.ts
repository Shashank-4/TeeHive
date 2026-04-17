// backend/services/design.service.ts (FIXED WITH VALIDATION)

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { r2 } from "../util/s3";
import { PrismaClient } from "@prisma/client";
import { collectDesignIdsFromManifestInput } from "./product.service";
import sharp from "sharp";

const prisma = new PrismaClient();

const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME;
const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL;

// Validate env variables on startup
if (!BUCKET_NAME) {
    throw new Error(
        "CLOUDFLARE_BUCKET_NAME is not defined in environment variables"
    );
}

if (!PUBLIC_URL) {
    throw new Error(
        "CLOUDFLARE_PUBLIC_URL is not defined in environment variables"
    );
}

export const uploadDesignToR2Service = async (
    file: Express.Multer.File,
    artistId: string
) => {
    try {
        // Validate file type
        if (!file.mimetype.startsWith("image/")) {
            throw new Error("Invalid file type. Only images are allowed.");
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error("File too large. Maximum size is 10MB.");
        }

        // Generate unique file key
        const fileExtension = file.mimetype.split("/")[1] || "jpg";
        const timestamp = Date.now();
        const randomId = nanoid(10);
        const fileKey = `designs/${artistId}/${timestamp}-${randomId}.${fileExtension}`;
        const thumbKey = `designs/${artistId}/${timestamp}-${randomId}-thumb.jpg`;

        // Trim transparent padding so the stored image tightly wraps the artwork.
        // sharp().trim() removes uniform border pixels (transparent for PNGs).
        let uploadBuffer = file.buffer;
        let uploadContentType = file.mimetype;
        try {
            const trimmed = await sharp(file.buffer)
                .trim()
                .png()
                .toBuffer();
            if (trimmed.length > 0) {
                uploadBuffer = trimmed;
                uploadContentType = "image/png";
            }
        } catch {
            // If trim fails (e.g. fully opaque JPEG), upload the original buffer as-is.
        }

        // Upload High-Res to R2
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: uploadBuffer,
            ContentType: uploadContentType,
        });

        await r2.send(command);

        // Generate and Upload Thumbnail to R2
        try {
            const thumbBuffer = await sharp(file.buffer)
                .resize(400)
                .jpeg({ quality: 80 })
                .toBuffer();
                
            const thumbCommand = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: thumbKey,
                Body: thumbBuffer,
                ContentType: "image/jpeg",
            });
            await r2.send(thumbCommand);
        } catch (thumbErr) {
            console.error("[R2Upload] Thumbnail generation/upload failed:", thumbErr);
            // proceed anyway
        }

        // Construct public URL for high res initially
        const imageUrl = `${PUBLIC_URL}/${fileKey}`;

        return { imageUrl, fileKey };
    } catch (error: any) {
        console.error("[R2Upload] Upload failed:", error);
        throw new Error(`R2 upload failed: ${error.message}`);
    }
};

export const createDesignService = async (input: {
    title: string;
    imageUrl: string;
    fileKey: string;
    artistId: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
}) => {
    const { title, imageUrl, fileKey, artistId, status } = input;

    // Validate inputs
    if (!title || !imageUrl || !fileKey) {
        throw new Error("Missing required fields: title, imageUrl, or fileKey");
    }

    try {
        const artist = await prisma.user.findUnique({ where: { id: artistId } });
        if (!artist) throw new Error("Artist not found");
        
        const artistNum = artist.artistNumber || 0;
        const nameParts = artist.name.trim().split(/\s+/);
        const firstInit = nameParts[0]?.charAt(0).toUpperCase() || 'X';
        const lastInit = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : 
                        (nameParts[0]?.length > 1 ? nameParts[0].charAt(1).toUpperCase() : 'X');
        
        // Count existing *non-deleted* designs logically, but actually count all designs 
        // to prevent duplicate serial numbers if a design is deleted.
        const totalDesigns = await prisma.design.count({ where: { artistId } });
        const designNum = totalDesigns + 1;
        
        const paddedArtistNum = artistNum.toString().padStart(3, '0');
        const paddedDesignNum = designNum.toString().padStart(3, '0');
        const designCode = `${firstInit}${lastInit}-${paddedArtistNum}-${paddedDesignNum}`;

        const newDesign = await prisma.design.create({
            data: {
                title,
                imageUrl,
                fileKey,
                artistId,
                designCode,
                ...(status && { status }),
            },
        });

        return newDesign;
    } catch (error: any) {
        console.error("[Design] Database error:", error);
        throw new Error(`Failed to save design: ${error.message}`);
    }
};

export const getDesignsByArtistService = async (artistId: string) => {
    try {
        const [designs, activeProducts] = await Promise.all([
            prisma.design.findMany({
                where: {
                    artistId: artistId,
                    isDeleted: false,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.product.findMany({
                where: {
                    artistId,
                    status: { in: ["DRAFT", "PUBLISHED"] },
                },
                select: { designId: true, draftEditorState: true },
            }),
        ]);

        const usedDesignIds = new Set<string>();
        for (const p of activeProducts) {
            for (const id of collectDesignIdsFromManifestInput(p.designId, p.draftEditorState)) {
                usedDesignIds.add(id);
            }
        }

        return designs.map((d) => ({
            ...d,
            isManifested: usedDesignIds.has(d.id),
        }));
    } catch (error: any) {
        console.error("[Designs] Database error:", error);
        throw new Error(`Failed to fetch designs: ${error.message}`);
    }
};

// Fetches a single design by its ID of a specified artist.

export const getDesignByIdService = async (
    designId: string,
    artistId: string
) => {
    const design = await prisma.design.findUnique({
        where: {
            id: designId,
            artistId: artistId,
        },
    });

    return design;
};
