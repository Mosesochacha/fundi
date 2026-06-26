import { Router } from "express";
import GeoController from "../controllers/geo.controller";

const router = Router();

router.get("/geo/detect", GeoController.detect);

export default router;
