import { Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { AuthenticatedRequest } from '../types/requests';
import {
  AdjustPointsBody,
  BlacklistBody,
  CreateCustomerBody,
  CustomerListQuery,
  CustomerNoteBody,
  CustomerPreferenceBody,
  MergeCustomersBody,
  RedeemRewardBody,
  SearchCustomersQuery,
  UpdateCustomerBody,
} from '../validations/customer.validation';

const customerService = new CustomerService();

export class CustomerController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const query = req.query as CustomerListQuery;
    const customers = await customerService.list(req.user, {
      tier: query.tier,
      search: query.search,
      page: query.page !== undefined ? Number(query.page) : undefined,
      pageSize: query.pageSize !== undefined ? Number(query.pageSize) : undefined,
    });
    res.json(customers);
  }

  static async get(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const customer = await customerService.get(req.user, req.params.id);
    res.json(customer);
  }

  static async create(
    req: AuthenticatedRequest<Record<string, never>, unknown, CreateCustomerBody>,
    res: Response
  ): Promise<void> {
    const payload: CreateCustomerBody = req.body;
    const customer = await customerService.create(req.user, payload);
    res.status(201).json(customer);
  }

  static async update(
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateCustomerBody>,
    res: Response
  ): Promise<void> {
    const payload: UpdateCustomerBody = req.body;
    const customer = await customerService.update(req.user, req.params.id, payload);
    res.json(customer);
  }

  static async bookings(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const bookings = await customerService.getBookings(req.user, req.params.id);
    res.json(bookings);
  }

  static async addNote(
    req: AuthenticatedRequest<{ id: string }, unknown, CustomerNoteBody>,
    res: Response
  ): Promise<void> {
    const payload: CustomerNoteBody = req.body;
    const note = await customerService.addNote(req.user, req.params.id, payload.note);
    res.status(201).json(note);
  }

  static async updatePreferences(
    req: AuthenticatedRequest<{ id: string }, unknown, CustomerPreferenceBody>,
    res: Response
  ): Promise<void> {
    const payload: CustomerPreferenceBody = req.body;
    const preferences = await customerService.updatePreferences(req.user, req.params.id, payload);
    res.json(preferences);
  }

  static async blacklist(
    req: AuthenticatedRequest<{ id: string }, unknown, BlacklistBody>,
    res: Response
  ): Promise<void> {
    const payload: BlacklistBody = req.body;
    const customer = await customerService.blacklist(req.user, req.params.id, payload.reason);
    res.json(customer);
  }

  static async removeBlacklist(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const customer = await customerService.removeBlacklist(req.user, req.params.id);
    res.json(customer);
  }

  static async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    const query = req.query as SearchCustomersQuery;
    const results = await customerService.search(req.user, query.term);
    res.json(results);
  }

  static async timeline(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const timeline = await customerService.getTimeline(req.user, req.params.id);
    res.json(timeline);
  }

  static async merge(
    req: AuthenticatedRequest<Record<string, never>, unknown, MergeCustomersBody>,
    res: Response
  ): Promise<void> {
    const payload: MergeCustomersBody = req.body;
    await customerService.merge(req.user, payload.primaryId, payload.duplicateId);
    res.status(204).send();
  }

  static async loyaltyStatus(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const status = await customerService.loyaltyStatus(req.user, req.params.id);
    res.json(status);
  }

  static async loyaltyHistory(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const history = await customerService.loyaltyHistory(req.user, req.params.id);
    res.json(history);
  }

  static async adjustPoints(
    req: AuthenticatedRequest<{ id: string }, unknown, AdjustPointsBody>,
    res: Response
  ): Promise<void> {
    const payload: AdjustPointsBody = req.body;
    await customerService.adjustPoints(req.user, req.params.id, payload.points, payload.reason);
    res.status(204).send();
  }

  static async rewards(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const rewards = await customerService.getRewards();
    res.json(rewards);
  }

  static async redeemReward(
    req: AuthenticatedRequest<Record<string, never>, unknown, RedeemRewardBody>,
    res: Response
  ): Promise<void> {
    const payload: RedeemRewardBody = req.body;
    await customerService.redeemReward(req.user, payload.customerId, payload.rewardId);
    res.status(204).send();
  }

  static async referrals(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const referrals = await customerService.referralStats(req.user, req.params.id);
    res.json(referrals);
  }

  static async export(req: AuthenticatedRequest<{ id: string }>, res: Response): Promise<void> {
    const data = await customerService.exportData(req.user, req.params.id);
    res.json(data);
  }
}
