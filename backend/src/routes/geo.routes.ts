import { Router } from "express";
import GeoController from "../controllers/geo.controller";

const router = Router();

// Public — used on the onboarding / profile pages before any rate is set.
router.get("/geo/detect", GeoController.detect);

export default router;
