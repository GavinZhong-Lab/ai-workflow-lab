/**
 * Paddle.js 前端封装
 * 初始化 Paddle.js 并打开 Checkout overlay
 */
import { initializePaddle, Paddle, CheckoutEventNames } from '@paddle/paddle-js';
import type { PaddleEventData } from '@paddle/paddle-js';

let paddleInstance: Paddle | null = null;
let initPromise: Promise<Paddle> | null = null;

// 等待中的 checkout：transactionId → resolve(status)
const pendingCheckouts = new Map<string, (status: string) => void>();

function handlePaddleEvent(event: PaddleEventData) {
  const txId = event?.data?.transaction_id;
  console.log('[Paddle Event]', event.name, 'tx:', txId);

  if (!txId) return;

  const resolve = pendingCheckouts.get(txId);
  if (!resolve) {
    console.log('[Paddle Event] No pending checkout for tx:', txId);
    return;
  }

  if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
    console.log('[Paddle Event] Checkout completed, resolving');
    resolve('completed');
    pendingCheckouts.delete(txId);
  } else if (event.name === CheckoutEventNames.CHECKOUT_CLOSED) {
    console.log('[Paddle Event] Checkout closed, resolving');
    resolve('closed');
    pendingCheckouts.delete(txId);
  }
}

export function getPaddle(): Promise<Paddle> {
  if (paddleInstance) return Promise.resolve(paddleInstance);
  if (initPromise) return initPromise;

  initPromise = initializePaddle({
    environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_bf5fd620e19f45e1c4784c774c1',
    eventCallback: handlePaddleEvent,
  }).then((paddle) => {
    if (!paddle) throw new Error('Failed to initialize Paddle.js');
    paddleInstance = paddle;
    console.log('[Paddle] Initialized successfully');
    return paddle;
  });

  return initPromise;
}

export async function openPaddleCheckout(transactionId: string): Promise<{ status: string }> {
  const paddle = await getPaddle();

  return new Promise((resolve) => {
    pendingCheckouts.set(transactionId, (status: string) => resolve({ status }));

    // Fallback timeout: resolve as 'closed' after 10 minutes
    const timeoutId = setTimeout(() => {
      if (pendingCheckouts.has(transactionId)) {
        console.log('[Paddle] Timeout for tx:', transactionId);
        pendingCheckouts.delete(transactionId);
        resolve({ status: 'closed' });
      }
    }, 10 * 60 * 1000);

    try {
      paddle.Checkout.open({ transactionId });
      console.log('[Paddle] Checkout opened for tx:', transactionId);
    } catch (err) {
      console.error('[Paddle] Failed to open checkout:', err);
      clearTimeout(timeoutId);
      pendingCheckouts.delete(transactionId);
      resolve({ status: 'error' });
    }
  });
}
