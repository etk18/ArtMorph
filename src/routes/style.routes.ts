import { Router } from "express";
import { getStyleSections, getStyles } from "../controllers/style.controller";

const router = Router();

router.get("/sections", getStyleSections);
router.get("/", getStyles);

export default router;
