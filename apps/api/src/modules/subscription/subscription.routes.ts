import { Router } from 'express';
import { subscriptionController } from './subscription.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permission.js';

export const subscriptionRouter = Router();

// 公开：获取套餐列表
subscriptionRouter.get('/plans', subscriptionController.getPlans);

// 需要认证
subscriptionRouter.get('/current', authMiddleware, subscriptionController.getCurrentSubscription);
subscriptionRouter.post('/checkout', authMiddleware, subscriptionController.createCheckout);
subscriptionRouter.post('/cancel', authMiddleware, subscriptionController.cancelSubscription);
subscriptionRouter.post('/change-plan', authMiddleware, subscriptionController.changePlan);
subscriptionRouter.get('/invoices', authMiddleware, subscriptionController.getInvoices);
subscriptionRouter.get('/payments', authMiddleware, subscriptionController.getPayments);
