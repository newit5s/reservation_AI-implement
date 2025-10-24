import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body, req.ip, req.headers['user-agent']);
    res.json(result);
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    const result = await authService.refreshToken(req.body);
    res.json(result);
  }

  static async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.body);
    res.status(204).send();
  }

  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    await authService.requestPasswordReset(req.body);
    res.status(202).json({ message: 'If the email exists, a reset link has been sent.' });
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body);
    res.json({ message: 'Password updated successfully.' });
  }
}
