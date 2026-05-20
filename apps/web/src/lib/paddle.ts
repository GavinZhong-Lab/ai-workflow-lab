/**
 * Paddle.js 前端封装
 * 初始化 Paddle.js 实例，提供 checkout 打开方法
 */
import { initializePaddle, type Paddle } from '@paddle/paddle-js';

let paddlePromise: Promise<Paddle> | null = null;

function getPaddle(): Promise<Paddle> {
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_token',
    }).then((paddle) => {
      if (!paddle) throw new Error('Paddle.js failed to initialize');
      return paddle;
    });
  }
  return paddlePromise;
}

/** 打开 Paddle Checkout overlay */
export async function openPaddleCheckout(checkoutUrl: string) {
  const paddle = await getPaddle();
  paddle.Checkout.open({ url: checkoutUrl });
}
