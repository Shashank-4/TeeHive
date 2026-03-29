import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../util/s3";

const prisma = new PrismaClient();
const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME || "";

export const listDesignsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const artistId = req.query.artistId as string;
        const status = req.query.status as string;

        const skip = (page - 1) * limit;

        const whereClause: any = { isDeleted: false };
        if (artistId) whereClause.artistId = artistId;
        if (status) whereClause.status = status;
        if (search) {
            whereClause.OR = [
                { designCode: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } }
            ];
        }

        const [designs, total] = await Promise.all([
            prisma.design.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    artist: { select: { id: true, name: true, displayName: true, email: true } }
                }
            }),
            prisma.design.count({ where: whereClause })
        ]);

        res.status(200).json({
            status: "success",
            data: {
                designs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const bulkFlagDesignsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { designIds, action, reason } = req.body;
        
        if (!Array.isArray(designIds) || designIds.length === 0) {
            return res.status(400).json({ status: "fail", message: "designIds must be a non-empty array" });
        }

        const isRejected = action === "REJECT";
        const status = isRejected ? "REJECTED" : "APPROVED";

        if (isRejected) {
            const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
            const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL || "";
            
            // For REJECT, we delete high res from R2 and point imageUrl to thumbnail
            const designs = await prisma.design.findMany({
                where: { id: { in: designIds } },
                select: { id: true, fileKey: true }
            });
            
            for (const design of designs) {
                if (design.fileKey && !design.fileKey.endsWith("-thumb.jpg")) {
                    try {
                        await r2.send(new DeleteObjectCommand({
                            Bucket: BUCKET_NAME,
                            Key: design.fileKey
                        }));
                    } catch (e) {
                        console.error("[R2Delete] Failed to delete high-res for rejected design:", design.fileKey, e);
                    }
                    
                    const thumbKey = design.fileKey.replace(/\.[^/.]+$/, "") + "-thumb.jpg";
                    const thumbUrl = `${PUBLIC_URL}/${thumbKey}`;
                    
                    await prisma.design.update({
                        where: { id: design.id },
                        data: {
                            isRejected: true,
                            status: "REJECTED",
                            rejectionReason: reason,
                            imageUrl: thumbUrl,
                            fileKey: thumbKey
                        }
                    });
                } else {
                    await prisma.design.update({
                        where: { id: design.id },
                        data: { isRejected: true, status: "REJECTED", rejectionReason: reason }
                    });
                }
            }
        } else {
            await prisma.design.updateMany({
                where: { id: { in: designIds } },
                data: { 
                    isRejected: false, 
                    status: "APPROVED", 
                    rejectionReason: null 
                }
            });
        }

        res.status(200).json({
            status: "success",
            message: `Successfully ${isRejected ? 'flagged' : 'approved'} ${designIds.length} designs.`
        });
    } catch (error) {
        next(error);
    }
};

export const bulkDownloadDesignsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { designIds } = req.body;
        
        if (!Array.isArray(designIds) || designIds.length === 0) {
            return res.status(400).json({ status: "fail", message: "designIds must be a non-empty array" });
        }

        // Fetch exactly these designs to get their fileKeys
        const designs = await prisma.design.findMany({
            where: { id: { in: designIds } },
            select: { id: true, designCode: true, fileKey: true, title: true }
        });

        if (designs.length === 0) {
            return res.status(404).json({ status: "fail", message: "No designs found" });
        }

        // Generate pre-signed URLs
        const downloadLinks = await Promise.all(designs.map(async (design) => {
            const filename = `${design.designCode || design.id}.${design.fileKey.split('.').pop()}`;
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: design.fileKey,
                ResponseContentDisposition: `attachment; filename="${filename}"`
            });
            // URL expires in 300 seconds (5 minutes)
            const url = await getSignedUrl(r2, command, { expiresIn: 300 });
            return {
                id: design.id,
                designCode: design.designCode,
                title: design.title,
                url,
                filename
            };
        }));

        res.status(200).json({
            status: "success",
            data: { downloadLinks }
        });
    } catch (error) {
        next(error);
    }
};
