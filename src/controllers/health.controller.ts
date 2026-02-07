import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
};

export const getDbHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    const profileCount = await prisma.userProfile.count();
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `;
    res.status(200).json({
      status: "ok",
      db: "connected",
      profileCount,
      tables,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      db: "failed",
      error: error.message,
      code: error.code,
      meta: error.meta,
      timestamp: new Date().toISOString()
    });
  }
};
