#!/bin/bash
# ============================================
# 一键启动开发环境
# 启动: bash dev-start.sh
# 停止: bash dev-start.sh --stop
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

stop_all() {
  log "Stopping all services..."

  # 停止前后端进程
  if [ -f /tmp/saas-api.pid ]; then
    kill "$(cat /tmp/saas-api.pid)" 2>/dev/null && log "Backend API stopped" || true
    rm -f /tmp/saas-api.pid
  fi
  if [ -f /tmp/saas-web.pid ]; then
    kill "$(cat /tmp/saas-web.pid)" 2>/dev/null && log "Frontend stopped" || true
    rm -f /tmp/saas-web.pid
  fi

  # 停止 pnpm dev 进程
  pkill -f "tsx watch" 2>/dev/null && log "Stopped tsx watch" || true
  pkill -f "next dev" 2>/dev/null && log "Stopped next dev" || true

  # 停止 Docker 容器
  docker-compose down 2>/dev/null && log "Docker containers stopped" || true

  log "All services stopped."
  exit 0
}

# --- 处理 --stop 参数 ---
if [ "$1" = "--stop" ]; then
  stop_all
fi

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   AI Workflow Lab — 开发环境启动${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# 1. Colima（Docker 运行时）
log "[1/4] Starting Colima..."
if colima status 2>/dev/null | grep -q "Running"; then
  log "Colima already running."
else
  colima start --cpu 2 --memory 4 2>&1 | tail -1
fi

# 2. Docker Compose（PostgreSQL / Redis / MinIO）
log "[2/4] Starting Docker services..."
docker-compose up -d 2>&1 | grep -v "^time=" || true

# 等待 PostgreSQL 健康检查通过
log "Waiting for PostgreSQL health check..."
for i in $(seq 1 30); do
  if docker-compose ps 2>/dev/null | grep postgres | grep -q "healthy"; then
    break
  fi
  sleep 1
done

echo ""
echo -e "${GREEN}  ✓ PostgreSQL 16${NC} → localhost:5432"
echo -e "${GREEN}  ✓ Redis 7${NC}       → localhost:6379"
echo -e "${GREEN}  ✓ MinIO${NC}         → localhost:9000 (console :9001)"
echo ""

# 3. 安装依赖（如需要）
log "[3/4] Checking dependencies..."
if [ ! -d "node_modules" ]; then
  log "Installing root dependencies..."
  pnpm install
fi
if [ ! -d "apps/api/node_modules" ]; then
  log "Installing API dependencies..."
  cd apps/api && pnpm install && cd "$SCRIPT_DIR"
fi
if [ ! -d "apps/web/node_modules" ]; then
  log "Installing Web dependencies..."
  cd apps/web && pnpm install && cd "$SCRIPT_DIR"
fi

# 数据库迁移（如 Prisma migrations 未应用）
log "Running Prisma migrations..."
cd apps/api && pnpm db:migrate 2>/dev/null && cd "$SCRIPT_DIR" || true

# 4. 启动前后端
log "[4/4] Starting frontend & backend..."

# 后端
cd apps/api
npx tsx watch --env-file=.env src/index.ts > /tmp/saas-api.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/saas-api.pid
cd "$SCRIPT_DIR"

# 前端
cd apps/web
npx next dev --port 3000 > /tmp/saas-web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > /tmp/saas-web.pid
cd "$SCRIPT_DIR"

# 等待服务就绪
log "Waiting for servers to be ready..."
for i in $(seq 1 30); do
  if curl -s http://localhost:4000 > /dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}  All services ready!${NC}"
echo ""
echo -e "  Backend API : ${CYAN}http://localhost:4000${NC}"
echo -e "  Frontend    : ${CYAN}http://localhost:3000${NC}"
echo -e "  MinIO Console: ${CYAN}http://localhost:9001${NC}"
echo ""
echo -e "  Stop all:   ${YELLOW}bash dev-start.sh --stop${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
