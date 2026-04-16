#!/usr/bin/env bash

# 自动定位到脚本所在的目录
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "${ROOT_DIR}/scripts/launch-remote-server.sh"

echo
echo "------------------------------------------------"
echo "提示：按【回车】键可关闭本窗口。"
echo "关闭本窗口后，服务器仍会在后台运行。"
echo "若要彻底关闭服务，请运行：停止远程图片服务器.command"
echo "------------------------------------------------"
read -r
