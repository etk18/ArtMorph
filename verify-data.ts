import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const sections = await prisma.styleSection.findMany({
        include: { styles: true }
    });
    console.log("Sections found:", sections.length);
    sections.forEach(s => {
        console.log(`- ${s.name} (${s.styles.length} styles)`);
        s.styles.forEach(st => console.log(`  - ${st.name} (Active: ${st.isActive})`));
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
