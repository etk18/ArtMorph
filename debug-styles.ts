import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const styles = await prisma.styleConfig.findMany({
        where: { isActive: true },
        select: { name: true, key: true, baseModel: true }
    });
    console.log("Active Styles:", JSON.stringify(styles, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
