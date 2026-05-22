#!/bin/bash
# ============================================
# 一键启动开发环境
# 启动:       bash dev-start.sh
# 生产数据库: bash dev-start.sh --prod-db
# 防止休眠:   bash dev-start.sh --prod-db --no-sleep
# 停止:       bash dev-start.sh --stop
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

PROD_DB=false
NO_SLEEP=false

stop_all() {
  log "Stopping all services..."

  # 停止 caffeinate（防止休眠）
  if [ -f /tmp/saas-caffeinate.pid ]; then
    kill "$(cat /tmp/saas-caffeinate.pid)" 2>/dev/null && log "Caffeinate stopped" || true
    rm -f /tmp/saas-caffeinate.pid
  fi

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

  # 停止 Docker 容器（仅非 prod-db 模式需要）
  if [ "$PROD_DB" = false ]; then
    docker-compose down 2>/dev/null && log "Docker containers stopped" || true
  fi

  log "All services stopped."
  exit 0
}

# --- 处理参数 ---
for arg in "$@"; do
  case $arg in
    --stop)    stop_all ;;
    --prod-db) PROD_DB=true ;;
    --no-sleep) NO_SLEEP=true ;;
  esac
done

echo ""
echo -e "${CYAN}============================================${NC}"
if [ "$PROD_DB" = true ]; then
  echo -e "${CYAN}   AI Workflow Lab — 开发环境（生产数据库）${NC}"
else
  echo -e "${CYAN}   AI Workflow Lab — 开发环境启动${NC}"
fi
echo -e "${CYAN}============================================${NC}"
echo ""

if [ "$PROD_DB" = true ]; then
  # ============ 生产数据库模式 ============
  # 跳过 Docker，直连 Supabase 生产库

  log "[1/3] Skipping Docker (using production Supabase)"
  echo -e "${YELLOW}  ⚠ 直连生产数据库 — 操作需谨慎${NC}"
  echo ""

  # 安装依赖
  log "[2/3] Checking dependencies..."
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

  # 启动前后端
  log "[3/3] Starting frontend & backend (prod DB)..."
  cd "$SCRIPT_DIR"
  cd apps/api
  npx tsx watch --env-file=.env.production src/index.ts > /tmp/saas-api.log 2>&1 &
  API_PID=$!
  echo $API_PID > /tmp/saas-api.pid
  cd "$SCRIPT_DIR"

  cd apps/web
  npx next dev --port 3000 --turbo > /tmp/saas-web.log 2>&1 &
  WEB_PID=$!
  echo $WEB_PID > /tmp/saas-web.pid
  cd "$SCRIPT_DIR"

else
  # ============ 本地模式 ============
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

  # 数据库迁移
  log "Running Prisma migrations..."
  (cd apps/api && pnpm db:migrate 2>/dev/null) || true

  # 4. 启动前后端
  log "[4/4] Starting frontend & backend..."
  cd "$SCRIPT_DIR"
  cd apps/api
  npx tsx watch --env-file=.env src/index.ts > /tmp/saas-api.log 2>&1 &
  API_PID=$!
  echo $API_PID > /tmp/saas-api.pid
  cd "$SCRIPT_DIR"

  cd apps/web
  npx next dev --port 3000 --turbo > /tmp/saas-web.log 2>&1 &
  WEB_PID=$!
  echo $WEB_PID > /tmp/saas-web.pid
  cd "$SCRIPT_DIR"
fi

# --- 防止系统休眠 ---
if [ "$NO_SLEEP" = true ] && [ -n "$API_PID" ]; then
  caffeinate -i -w $API_PID &
  CAFFEINATE_PID=$!
  echo $CAFFEINATE_PID > /tmp/saas-caffeinate.pid
  log "Caffeinate active — Mac sleep prevented while API is running"
fi

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
if [ "$PROD_DB" = true ]; then
  echo -e "  Database    : ${YELLOW}Supabase Production${NC}"
  echo ""
  echo -e "  ${YELLOW}⚠ 正在写入生产数据库！${NC}"
else
  echo -e "  MinIO Console: ${CYAN}http://localhost:9001${NC}"
fi
if [ "$NO_SLEEP" = true ]; then
  echo -e "  Sleep       : ${RED}已禁止（熄屏不影响）${NC}"
fi
echo ""
echo -e "  Stop all:   ${YELLOW}bash dev-start.sh --stop${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
