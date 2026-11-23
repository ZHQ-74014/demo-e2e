# demo-e2e

多仓全栈演示的 Playwright 端到端测试仓库。

测试脚本要求 `demo-web`、`demo-api`、`demo-worker` 和 `demo-e2e` 在同一个父目录下。运行时会自动构建并启动 API、启动 Web，然后在 Chromium 中验证同步报表导出。

## 运行

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

当前基线只验证同步导出。后续 LoopForge 需求需要把启动脚本接入 Worker，并把测试更新为异步状态流转。
