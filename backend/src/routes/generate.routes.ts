import { Router } from 'express';
import GenerateController from '../controllers/generate.controller';

const router = Router();

router.post('/generate/profile', GenerateController.generateProfile);

export default router;
