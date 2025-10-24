import { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';

export const getHealth = async (_req: Request, res: Response): Promise<Response> => {
  const status = await getHealthStatus();
  return res.json(status);
};
