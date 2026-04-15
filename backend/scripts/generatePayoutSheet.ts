/**
 * Server-side payout sheet generator.
 *
 * Usage (from the backend/ directory):
 *
 *   # Generate payout CSV for a month:
 *   npx ts-node scripts/generatePayoutSheet.ts --month 2026-03
 *
 *   # Mark a batch as paid:
 *   npx ts-node scripts/generatePayoutSheet.ts --mark-paid --batch <batchId> --reference "UTR123456"
 *
 * On Render:
 *   Open the Shell tab for your backend service, then run:
 *   node -e "require('./dist/scripts/generatePayoutSheet.js')" -- --month 2026-03
 *   Or use a one-off job (see README section).
 *
 * The CSV is written to stdout by default. Pipe to a file:
 *   npx ts-node scripts/generatePayoutSheet.ts --month 2026-03 > /tmp/payout.csv
 *
 * Environment: requires DATABASE_URL and PAYOUT_DETAILS_ENCRYPTION_KEY in .env
 */

import { PrismaClient, Prisma, OrderStatus } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// ── Encryption helpers (mirrored from artistPayout.service.ts) ──

function getPayoutEncryptionKey() {
    const secret = process.env.PAYOUT_DETAILS_ENCRYPTION_KEY;
    if (!secret) {
        throw new Error("PAYOUT_DETAILS_ENCRYPTION_KEY is not set.");
    }
    return crypto.createHash("sha256").update(secret).digest();
}

function decryptValue(value: string | null | undefined): string {
    if (!value) return "";
    try {
        const payload = Buffer.from(value, "base64");
        const iv = payload.subarray(0, 12);
        const tag = payload.subarray(12, 28);
        const encrypted = payload.subarray(28);
        const decipher = crypto.createDecipheriv("aes-256-gcm", getPayoutEncryptionKey(), iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch {
        return "[DECRYPTION_FAILED]";
    }
}

// ── Audit logging ──

const SCRIPT_ADMIN_ID = "SYSTEM_PAYOUT_SCRIPT";

async function writeAuditLog(action: string, metadata: Record<string, unknown>) {
    try {
        await prisma.adminAuditLog.create({
            data: {
                adminId: SCRIPT_ADMIN_ID,
                action,
                resourceType: "ArtistSettlement",
                metadata: metadata as Prisma.InputJsonValue,
            },
        });
    } catch (err) {
        console.error("[audit] Failed to write audit log:", err);
    }
}

// ── CLI argument parsing ──

function parseArgs() {
    const args = process.argv.slice(2);
    const flags: Record<string, string | boolean> = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--mark-paid") {
            flags.markPaid = true;
        } else if (arg === "--month" && args[i + 1]) {
            flags.month = args[++i];
        } else if (arg === "--batch" && args[i + 1]) {
            flags.batch = args[++i];
        } else if (arg === "--reference" && args[i + 1]) {
            flags.reference = args[++i];
        } else if (arg === "--help" || arg === "-h") {
            flags.help = true;
        }
    }
    return flags;
}

function printUsage() {
    const msg = `
TeeHive Payout Sheet Generator
===============================

Generate:
  npx ts-node scripts/generatePayoutSheet.ts --month 2026-03

  Outputs CSV to stdout. Pipe to save:
  npx ts-node scripts/generatePayoutSheet.ts --month 2026-03 > payout-march.csv

Mark as paid:
  npx ts-node scripts/generatePayoutSheet.ts --mark-paid --batch <batchId> --reference "UTR/REF"

On Render (after build):
  node dist/scripts/generatePayoutSheet.js --month 2026-03
`;
    console.error(msg.trim());
}

// ── CSV helpers ──

function csvEscape(val: unknown): string {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

// ── Generate payout sheet ──

async function generateSheet(monthStr: string) {
    const match = monthStr.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
        console.error("ERROR: --month must be YYYY-MM format (e.g. 2026-03)");
        process.exit(1);
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    console.error(`\nPeriod: ${periodStart.toISOString().slice(0, 10)} → ${periodEnd.toISOString().slice(0, 10)}`);
    console.error("Querying order items...");

    const SETTLED_STATUSES: OrderStatus[] = [
        "PAID", "SHIPPED", "DELIVERED", "RECEIVED",
        "PROCESSING", "IN_TRANSIT", "OUT_FOR_DELIVERY",
    ];

    const earningRows = await prisma.orderItem.groupBy({
        by: ["artistId"],
        where: {
            artistId: { not: null },
            order: {
                createdAt: { gte: periodStart, lte: periodEnd },
                status: { in: SETTLED_STATUSES },
            },
        },
        _sum: { artistShareAmount: true, price: true },
        _count: { _all: true },
    });

    if (earningRows.length === 0) {
        console.error("No artist earnings found for this period.");
        await writeAuditLog("GENERATE_PAYOUT_SHEET", {
            month: monthStr, artistCount: 0, note: "No earnings in period",
        });
        await prisma.$disconnect();
        return;
    }

    console.error(`Found earnings for ${earningRows.length} artist(s). Fetching payout methods...`);

    const artistIds = earningRows
        .filter((r) => r.artistId != null)
        .map((r) => r.artistId as string);

    const payoutMethods = await prisma.artistPayoutMethod.findMany({
        where: {
            artistId: { in: artistIds },
            isActive: true,
            isDefault: true,
        },
        include: {
            artist: {
                select: { id: true, name: true, email: true, displayName: true, artistNumber: true },
            },
        },
    });

    const methodByArtist = new Map(payoutMethods.map((m) => [m.artistId, m]));

    const allArtists = await prisma.user.findMany({
        where: { id: { in: artistIds } },
        select: { id: true, name: true, email: true, displayName: true, artistNumber: true },
    });
    const artistMap = new Map(allArtists.map((a) => [a.id, a]));

    const batchId = crypto.randomBytes(6).toString("hex");
    let decryptedCount = 0;
    let missingMethodCount = 0;

    const csvHeaders = [
        "Batch ID", "Artist #", "Name", "Email", "Items Sold",
        "Gross Sales (INR)", "Artist Share (INR)",
        "Method Type", "UPI ID", "UPI Name",
        "Bank Name", "Account Holder", "Account Number", "IFSC",
        "Has Active Method", "Settlement ID",
    ];

    const csvLines: string[] = [csvHeaders.map(csvEscape).join(",")];

    for (const row of earningRows) {
        const artistId = row.artistId as string;
        const method = methodByArtist.get(artistId);
        const artist = method?.artist || artistMap.get(artistId);

        const itemCount = row._count?._all ?? 0;
        const grossSales = row._sum?.price ?? 0;
        const sumShare = row._sum?.artistShareAmount ?? 0;
        const artistShare = sumShare > 0
            ? Math.round(sumShare * 100) / 100
            : Math.round(grossSales * 0.25 * 100) / 100;

        let upiId = "";
        let upiName = "";
        let bankName = "";
        let accountHolder = "";
        let accountNumber = "";
        let ifsc = "";
        let methodType = "";

        if (method) {
            decryptedCount++;
            if (method.methodType === "UPI") {
                methodType = "UPI";
                upiId = method.upiId || "";
                upiName = method.upiName || "";
            } else {
                methodType = "BANK";
                bankName = method.bankName || "";
                accountHolder = method.bankAccountName || "";
                accountNumber = decryptValue(method.bankAccountNumberEncrypted);
                ifsc = method.bankIfsc || "";
            }
        } else {
            missingMethodCount++;
        }

        const settlement = await prisma.artistSettlement.create({
            data: {
                artistId,
                payoutMethodId: method?.id || null,
                amount: artistShare,
                currency: "inr",
                status: "PENDING",
                periodStart,
                periodEnd,
                notes: `Batch ${batchId} | ${itemCount} items | Gross ₹${grossSales}`,
            },
        });

        csvLines.push([
            batchId,
            artist?.artistNumber ?? "",
            artist?.displayName || artist?.name || "Unknown",
            artist?.email || "",
            itemCount,
            grossSales.toFixed(2),
            artistShare.toFixed(2),
            methodType,
            upiId,
            upiName,
            bankName,
            accountHolder,
            accountNumber,
            ifsc,
            method ? "Yes" : "No",
            settlement.id,
        ].map(csvEscape).join(","));
    }

    // Write CSV to stdout
    console.log(csvLines.join("\n"));

    await writeAuditLog("GENERATE_PAYOUT_SHEET", {
        month: monthStr,
        batchId,
        artistCount: earningRows.length,
        decryptedCount,
        missingMethodCount,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
    });

    console.error(`\n✓ Batch: ${batchId}`);
    console.error(`✓ ${earningRows.length} artist(s) processed`);
    console.error(`✓ ${decryptedCount} payout method(s) decrypted`);
    if (missingMethodCount > 0) {
        console.error(`⚠ ${missingMethodCount} artist(s) have NO active default payout method`);
    }
    console.error(`✓ ${earningRows.length} ArtistSettlement records created (status: PENDING)`);
    console.error(`✓ Audit log entry written`);
    console.error(`\nTo mark as paid after manual transfer:`);
    console.error(`  npx ts-node scripts/generatePayoutSheet.ts --mark-paid --batch ${batchId} --reference "YOUR_UTR"`);

    await prisma.$disconnect();
}

// ── Mark batch as paid ──

async function markPaid(batchId: string, reference: string) {
    console.error(`\nMarking batch ${batchId} as PAID...`);

    const settlements = await prisma.artistSettlement.findMany({
        where: {
            notes: { contains: `Batch ${batchId}` },
            status: "PENDING",
        },
    });

    if (settlements.length === 0) {
        console.error("ERROR: No PENDING settlements found for this batch. Already paid or invalid batch ID.");
        await prisma.$disconnect();
        process.exit(1);
    }

    const now = new Date();
    await prisma.artistSettlement.updateMany({
        where: {
            id: { in: settlements.map((s) => s.id) },
        },
        data: {
            status: "PAID",
            bankReference: reference,
            processedAt: now,
        },
    });

    await writeAuditLog("MARK_PAYOUT_BATCH_PAID", {
        batchId,
        reference,
        settlementCount: settlements.length,
        totalAmount: settlements.reduce((s, r) => s + r.amount, 0),
        processedAt: now.toISOString(),
    });

    console.error(`✓ ${settlements.length} settlement(s) marked as PAID`);
    console.error(`✓ Bank reference: ${reference}`);
    console.error(`✓ Audit log entry written`);

    await prisma.$disconnect();
}

// ── Main ──

async function main() {
    const flags = parseArgs();

    if (flags.help) {
        printUsage();
        process.exit(0);
    }

    if (flags.markPaid) {
        if (!flags.batch || typeof flags.batch !== "string") {
            console.error("ERROR: --mark-paid requires --batch <batchId>");
            process.exit(1);
        }
        if (!flags.reference || typeof flags.reference !== "string") {
            console.error("ERROR: --mark-paid requires --reference <UTR or bank ref>");
            process.exit(1);
        }
        await markPaid(flags.batch, flags.reference);
        return;
    }

    if (!flags.month || typeof flags.month !== "string") {
        console.error("ERROR: --month YYYY-MM is required.");
        printUsage();
        process.exit(1);
    }

    await generateSheet(flags.month);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
