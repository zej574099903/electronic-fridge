#!/usr/bin/env bash

# ----------------------------------------------------------------
# 远程镜像服务器关闭工具
# ----------------------------------------------------------------

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/.runtime"
SERVER_PID_FILE="${LOG_DIR}/server.pid"
TUNNEL_PID_FILE="${LOG_DIR}/cloudflared.pid"

cleanup_process() {
  local name="$1"
  local pid_file="$2"
  if [[ -f "${pid_file}" ]]; then
    local pid
    pid="$(cat "${pid_file}" 2>/dev/null || true)"
    if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
      echo "正在关闭 ${name} (PID: ${pid})..."
      kill "${pid}" 2>/dev/null || true
      sleep 1
    fi
    rm -f "${pid_file}"
  else
    echo "${name} 似乎并未运行。"
  fi
}

echo "------------------------------------------------"
echo "🛑 正在执行系统清理..."
cleanup_process "Cloudflare 隧道" "${TUNNEL_PID_FILE}"
cleanup_process "图片服务器" "${SERVER_PID_FILE}"
echo "------------------------------------------------"
echo "✅ 所有服务已安全下线。"
echo "------------------------------------------------"
