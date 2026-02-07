import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { listSectionsWithStyles, listStyles } from "../services/style.service";

export const getStyleSections = asyncHandler(async (_req: Request, res: Response) => {
  const sections = await listSectionsWithStyles();

  res.status(200).json({
    status: "ok",
    sections
  });
});

export const getStyles = asyncHandler(async (req: Request, res: Response) => {
  const sectionKey = typeof req.query.section === "string" ? req.query.section : undefined;
  const styles = await listStyles(sectionKey);

  res.status(200).json({
    status: "ok",
    styles
  });
});
