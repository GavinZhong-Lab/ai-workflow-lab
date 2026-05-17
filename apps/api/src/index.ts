/**
 * API 服务入口
 * 启动 Express HTTP 服务器
 */
import { createApp } from './app.js';
import { env } from './config/index.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API server running on http://localhost:${env.PORT}`);
});
