import { randomUUID } from 'crypto';
import ms from 'ms';
import { User } from '@prisma/client';
import { env } from '../config/env';
import {
  LoginPayload,
  LoginResult,
  PasswordResetRequestPayload,
  RefreshPayload,
  ResetPasswordPayload,
} from '../types/auth';
import { AppError } from '../utils/app-error';
import { signToken, verifyToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { SessionService } from './session.service';
import { UserRepository } from '../repositories/user.repository';
import { AuditService } from './audit.service';
import { EmailService } from './email.service';
import { PASSWORD_RESET_PREFIX, PASSWORD_RESET_TOKEN_TTL } from '../utils/constants';
import { RedisService } from './redis.service';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private buildAccessToken(user: User): { token: string; expiresIn: number } {
    const expiresIn = ms(env.JWT_EXPIRE);
    const token = signToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        type: 'access',
      },
      env.JWT_EXPIRE
    );
    return { token, expiresIn };
  }

  private async buildRefreshToken(user: User): Promise<{ token: string; expiresIn: number }> {
    const session = await SessionService.createSession(user.id);
    const expiresIn = ms(env.REFRESH_TOKEN_EXPIRE);
    const token = signToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        type: 'refresh',
        tokenId: session.tokenId,
      },
      env.REFRESH_TOKEN_EXPIRE
    );
    return { token, expiresIn };
  }

  async login(payload: LoginPayload, ip?: string, userAgent?: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(payload.email.toLowerCase());

    if (!user || !user.passwordHash) {
      await AuditService.recordLoginAttempt({
        email: payload.email,
        success: false,
        message: 'Invalid credentials',
        ipAddress: ip,
        userAgent,
      });
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      await AuditService.recordLoginAttempt({
        email: payload.email,
        success: false,
        message: 'Account disabled',
        userId: user.id,
        ipAddress: ip,
        userAgent,
      });
      throw new AppError('Account is disabled', 403);
    }

    const passwordMatches = await comparePassword(payload.password, user.passwordHash);

    if (!passwordMatches) {
      await AuditService.recordLoginAttempt({
        email: payload.email,
        success: false,
        message: 'Invalid credentials',
        userId: user.id,
        ipAddress: ip,
        userAgent,
      });
      throw new AppError('Invalid email or password', 401);
    }

    await this.userRepository.updateLastLogin(user.id);
    await AuditService.recordLoginAttempt({
      email: user.email,
      success: true,
      userId: user.id,
      ipAddress: ip,
      userAgent,
    });

    const accessToken = this.buildAccessToken(user);
    const refreshToken = await this.buildRefreshToken(user);

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      expiresIn: accessToken.expiresIn,
      refreshTokenExpiresIn: refreshToken.expiresIn,
    };
  }

  async refreshToken(payload: RefreshPayload): Promise<LoginResult> {
    const decoded = verifyToken(payload.refreshToken);
    if (decoded.type !== 'refresh' || !decoded.tokenId) {
      throw new AppError('Invalid refresh token', 401);
    }

    const session = await SessionService.getSession(decoded.tokenId);
    if (!session || session.userId !== decoded.sub) {
      throw new AppError('Session expired or invalid', 401);
    }

    const user = await this.userRepository.findById(decoded.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.isActive) {
      throw new AppError('Account is disabled', 403);
    }

    await SessionService.revokeSession(decoded.tokenId);
    const accessToken = this.buildAccessToken(user);
    const refreshToken = await this.buildRefreshToken(user);

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      expiresIn: accessToken.expiresIn,
      refreshTokenExpiresIn: refreshToken.expiresIn,
    };
  }

  async logout(payload: RefreshPayload): Promise<void> {
    const decoded = verifyToken(payload.refreshToken);
    if (decoded.type !== 'refresh' || !decoded.tokenId) {
      throw new AppError('Invalid refresh token', 401);
    }
    await SessionService.revokeSession(decoded.tokenId);
  }

  async requestPasswordReset(payload: PasswordResetRequestPayload): Promise<void> {
    const user = await this.userRepository.findByEmail(payload.email.toLowerCase());
    if (!user) {
      return;
    }
    const token = randomUUID();
    const client = RedisService.getClient();
    await client.set(
      `${PASSWORD_RESET_PREFIX}:${token}`,
      JSON.stringify({ userId: user.id }),
      'EX',
      PASSWORD_RESET_TOKEN_TTL
    );

    await EmailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>Use this token to reset your password: <strong>${token}</strong></p>`,
    });
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    const client = RedisService.getClient();
    const data = await client.get(`${PASSWORD_RESET_PREFIX}:${payload.token}`);
    if (!data) {
      throw new AppError('Password reset token expired or invalid', 400);
    }

    const { userId } = JSON.parse(data) as { userId: string };
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const hashedPassword = await hashPassword(payload.password);
    await this.userRepository.setPassword(userId, hashedPassword);
    await client.del(`${PASSWORD_RESET_PREFIX}:${payload.token}`);
    await SessionService.revokeUserSessions(userId);
  }
}
