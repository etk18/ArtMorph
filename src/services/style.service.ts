import { prisma } from "../config/prisma";

export const listSectionsWithStyles = async () => {
  return prisma.styleSection.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      styles: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });
};

export const listStyles = async (sectionKey?: string) => {
  return prisma.styleConfig.findMany({
    where: {
      isActive: true,
      section: sectionKey ? { key: sectionKey } : undefined
    },
    orderBy: [{ sectionId: "asc" }, { createdAt: "asc" }],
    include: {
      section: true
    }
  });
};
