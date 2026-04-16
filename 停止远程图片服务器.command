#!/usr/bin/env bash

# 自动定位到脚本所在的目录
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "${ROOT_DIR}/scripts/stop-remote-server.sh"

echo
echo "按【回车】键关闭本窗口。"
read -r
