#!/bin/bash
# 构建后处理：复制云函数 + 配置云环境绑定

DIST_DIR="dist/build/mp-weixin"
CLOUD_ENV_ID="cloud1-d8gxnkiqv0f04d19b"

if [ ! -d "$DIST_DIR" ]; then
  echo "构建输出目录不存在: $DIST_DIR"
  exit 1
fi

# 复制云函数
if [ -d "cloudfunctions" ]; then
  cp -r cloudfunctions "$DIST_DIR/cloudfunctions"
  echo "云函数已复制到 $DIST_DIR/cloudfunctions/"
else
  echo "警告: cloudfunctions 目录不存在"
fi

# 更新 project.config.json，确保包含 cloudfunctionRoot 和云环境配置
CONFIG_FILE="$DIST_DIR/project.config.json"
if [ -f "$CONFIG_FILE" ]; then
  # 使用 node 来修改 JSON（保留格式）
  node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
    config.cloudfunctionRoot = 'cloudfunctions/';
    config.setting.cloud = true;
    config.cloudbaseRoot = 'cloudfunctions/';
    fs.writeFileSync('$CONFIG_FILE', JSON.stringify(config, null, 2));
  "
  echo "project.config.json 已更新"
fi

echo "构建后处理完成"