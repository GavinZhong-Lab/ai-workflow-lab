import { Response } from 'express';
import { subscriptionService } from './subscription.service.js';
import type { AuthRequest } from '../../middleware/auth.js';

export class SubscriptionController {
  async getPlans(_req: AuthRequest, res: Response) {
    const result = await subscriptionService.getPlans();
    res.json(result);
  }

  async getCurrentSubscription(req: AuthRequest, res: Response) {
    const result = await subscriptionService.getCurrentSubscription(req.orgId!);
    res.json(result);
  }

  async createCheckout(req: AuthRequest, res: Response) {
    const { planId, employeeCount } = req.body;
    const successUrl = `${req.headers.origin || process.env.APP_URL}/billing?checkout=success`;
    const result = await subscriptionService.createCheckout(
      req.orgId!,
      req.body.email || '',
      planId,
      employeeCount,
      successUrl,
    );
    const status = result.code === 0 ? 200 : 400;
    res.status(status).json(result);
  }

  async syncFromTransaction(req: AuthRequest, res: Response) {
    const { transactionId } = req.body;
    if (!transactionId) {
      res.status(400).json({ code: 400, data: null, message: 'transactionId is required' });
      return;
    }
    try {
      const result = await subscriptionService.syncFromTransaction(req.orgId!, transactionId);
      const status = result.code === 0 ? 200 : 400;
      res.status(status).json(result);
    } catch (err) {
      console.error('[Sync] Failed:', err);
      res.status(500).json({ code: 500, data: null, message: 'Sync failed, please try again' });
    }
  }

  async cancelSubscription(req: AuthRequest, res: Response) {
    const result = await subscriptionService.cancelSubscription(req.orgId!);
    const status = result.code === 0 ? 200 : 400;
    res.status(status).json(result);
  }

  async changePlan(req: AuthRequest, res: Response) {
    const { newPlanId, employeeCount } = req.body;
    const result = await subscriptionService.changePlan(req.orgId!, newPlanId, employeeCount);
    const status = result.code === 0 ? 200 : 400;
    res.status(status).json(result);
  }

  async getInvoices(req: AuthRequest, res: Response) {
    const after = req.query.after as string | undefined;
    const result = await subscriptionService.getInvoices(req.orgId!, after);
    res.json(result);
  }

  async getPayments(req: AuthRequest, res: Response) {
    const after = req.query.after as string | undefined;
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const result = await subscriptionService.getPayments(req.orgId!, after, limit);
    res.json(result);
  }
}

export const subscriptionController = new SubscriptionController();
