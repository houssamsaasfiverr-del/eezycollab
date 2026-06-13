import { Router, Request, Response } from 'express';
import { sendCampaign, getInbox, getSmtpConfig, saveSmtpConfig } from '../controllers/emailController.js';

const router = Router();

router.post('/send', (req: Request, res: Response) => {
  void sendCampaign(req, res);
});

router.get('/inbox', (req: Request, res: Response) => {
  void getInbox(req, res);
});

router.get('/smtp-config', (req: Request, res: Response) => {
  void getSmtpConfig(req, res);
});

router.post('/smtp-config', (req: Request, res: Response) => {
  void saveSmtpConfig(req, res);
});

export default router;
