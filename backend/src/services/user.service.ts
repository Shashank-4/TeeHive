import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const findUserById = async (id: string) => {
    return await prisma.user.findUnique({ where: { id } });
};
