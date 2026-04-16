#!/usr/bin/env bash

# ----------------------------------------------------------------
# 全自动远程镜像服务器启动引擎 (Cloudflare 版本)
# ----------------------------------------------------------------

set -euo pipefail

# 1. 基础环境定义
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin:/usr/bin
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/.runtime"
SERVER_LOG="${LOG_DIR}/server.log"
TUNNEL_LOG="${LOG_DIR}/cloudflared.log"
SERVER_PID_FILE="${LOG_DIR}/server.pid"
TUNNEL_PID_FILE="${LOG_DIR}/cloudflared.pid"
NETWORK_CONFIG="${ROOT_DIR}/apps/mobile/src/constants/network.ts"
PORT=3000
TARGET_URL="http://127.0.0.1:${PORT}"

# 判断 cloudflared 是否存在
CLOUDFLARED_BIN=$(which cloudflared || echo "/opt/homebrew/bin/cloudflared")

mkdir -p "${LOG_DIR}"
cd "${ROOT_DIR}"

# 2. 清理旧进程函数
cleanup_process() {
  local pid_file="$1"
  if [[ -f "${pid_file}" ]]; then
    local pid
    pid="$(cat "${pid_file}" 2>/dev/null || true)"
    if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
      echo "清理旧进程: ${pid}..."
      kill "${pid}" 2>/dev/null || true
      sleep 1
    fi
    rm -f "${pid_file}"
  fi
}

echo "------------------------------------------------"
echo "🛠️  正在初始化环境..."
cleanup_process "${TUNNEL_PID_FILE}"
cleanup_process "${SERVER_PID_FILE}"

# 3. 启动本地服务器
echo "🚀 启动本地图片服务器..."
nohup node "${ROOT_DIR}/apps/image-server/index.js" >"${SERVER_LOG}" 2>&1 &
echo $! > "${SERVER_PID_FILE}"

# 等待应用启动
sleep 2

# 4. 开启 Cloudflare 隧道
echo "🌐 正在开启公网映射隧道..."
: > "${TUNNEL_LOG}"
nohup "${CLOUDFLARED_BIN}" tunnel --url "${TARGET_URL}" --no-autoupdate >"${TUNNEL_LOG}" 2>&1 &
echo $! > "${TUNNEL_PID_FILE}"

# 5. 捕获生成的公网网址
TUNNEL_URL=""
echo "⌛ 正在等待公网 URL 生成..."
for _ in {1..30}; do
  if [[ -f "${TUNNEL_LOG}" ]]; then
    # 匹配 trycloudflare.com 域名
    TUNNEL_URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "${TUNNEL_LOG}" | head -n 1 || true)"
    if [[ -n "${TUNNEL_URL}" ]]; then
      break
    fi
  fi
  sleep 1
done

if [[ -z "${TUNNEL_URL}" ]]; then
  echo "❌ 失败: 隧道开启成功但未探测到网址，请检查日志: ${TUNNEL_LOG}"
  exit 1
fi

# 6. 【核心黑科技】自动修改 App 网络配置
echo "🔗 正在自动修补 App 网络连接点..."
if [[ -f "${NETWORK_CONFIG}" ]]; then
  # 使用 sed 自动替换 IMAGE_SERVER_BASE_URL 的值
  # 注意 Mac 的 sed 语法要求指定 -i ''
  sed -i '' "s|export const IMAGE_SERVER_BASE_URL = .*|export const IMAGE_SERVER_BASE_URL = \`${TUNNEL_URL}\`;|g" "${NETWORK_CONFIG}"
  sed -i '' "s|export const STATIC_IMAGES_BASE_URL = .*|export const STATIC_IMAGES_BASE_URL = \`${TUNNEL_URL}\`;|g" "${NETWORK_CONFIG}"
  echo "✅ 代码注入成功: ${NETWORK_CONFIG} 已更新为新地址。"
else
  echo "⚠️ 警告: 未找到 network.ts，请确认路径是否正确。"
fi

# 6.5. 【情报中转】同步到 GitHub 以便离线寻址
echo "📡 正在同步云端寻址登记处..."
ISO_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{ \"url\": \"$TUNNEL_URL\", \"updatedAt\": \"$ISO_TIME\" }" > "${ROOT_DIR}/discovery.json"
git add "${ROOT_DIR}/discovery.json"
# 即使没有变动也不报错
git commit -m "chore: update discovery url [$ISO_TIME]" || true
git push origin main || true
echo "✅ 云端寻址同步成功！"

# 7. 善后处理
printf "%s" "${TUNNEL_URL}" | pbcopy

echo "------------------------------------------------"
echo "🎉 全系统启动成功！"
echo "本地地址: ${TARGET_URL}"
echo "外部公网: ${TUNNEL_URL}"
echo "------------------------------------------------"
echo "💡 提示: 公网网址已自动复制到您的剪贴板。"
echo "💡 提示: App 的网络配置已自动更新，无需重编代码！"
echo "------------------------------------------------"
echo "按 Ctrl+C 可在此处监控日志 (当前为静默模式)..."
echo "或者直接关闭此窗口（服务器将在后台继续运行）。"
echo "运行 ./scripts/stop-remote-server.sh 可彻底关闭服务。"
