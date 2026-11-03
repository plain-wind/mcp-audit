# mcp-audit

[![CI](https://github.com/plain-wind/mcp-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/plain-wind/mcp-audit/actions/workflows/ci.yml)

基于 [MCP](https://modelcontextprotocol.io) 的前端工程依赖安全审计服务。一次工具调用即可完成：解析工程 → 复用/生成 lockfile → `npm audit` → 规范化 → 输出 markdown 报告。

- 审计本地工程（绝对路径）或 GitHub 仓库 URL
- **优先复用工程已有的 lockfile**，避免按 semver 重新解析导致漏报
- 补充审计工程自身（npm 上已发布版本）的已知漏洞
- 报告包含依赖链、受影响版本、**修复建议**、漏洞包的绝对路径
- **失败即报错**：审计失败绝不会被渲染成“没有发现任何风险漏洞”

## 环境要求

- Node.js >= 20.11
- pnpm 11（`corepack enable` 会自动启用 `packageManager` 指定的版本）
- 可访问 npm registry

## 安装与运行

```bash
pnpm install
pnpm start   # 以 stdio 方式启动 MCP 服务
```

## 在 MCP 客户端中配置

```json
{
  "mcpServers": {
    "mcp-audit": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-audit/src/mcpServer.js"]
    }
  }
}
```

## 工具参数

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `projectRoot` | 是 | 本地工程根目录绝对路径，或 GitHub 仓库 URL |
| `savePath` | 否 | 另存为文件的绝对路径，父目录会自动创建 |

工具会把 markdown 报告直接作为响应内容返回；传入 `savePath` 时额外落盘，并在响应末尾附一条保存路径提示。

## 输出示例

```markdown
# `demo-site` 安全审计报告

- 受影响的依赖包：**3** 个
- 漏洞条目：**5** 条
- 依赖树来源：工程自带的 lockfile

| 等级 | 依赖包 | 漏洞条目 |
| --- | ---: | ---: |
| 严重 | 1 | 2 |

## 严重漏洞（1 个依赖包）

### `lodash`（直接依赖）

- 漏洞等级：**严重**
- 修复建议：升级到 lodash@4.17.21
...
```

## 工作流程

1. `parseProject`：读取本地 `package.json`，或从 GitHub 拉取远端仓库根目录的 `package.json`
2. `generateLock`：工程有 `npm-shrinkwrap.json` / `package-lock.json` 时直接复用；否则执行 `npm install --package-lock-only` 生成
3. `audit`：运行 `npm audit --json`，用 lockfile 的安装路径构建依赖图，并补充工程自身的漏洞公告
4. `render`：用 EJS 模板渲染为 markdown

## 已知限制

- 只支持 npm 生态，不解析 `pnpm-lock.yaml` / `yarn.lock`
- 远程仓库仅支持 `github.com`，且只审计仓库根目录的 `package.json`（monorepo 子包不单独审计）
- 工程自身的漏洞来自 npm 的 vulnerabilities 接口；接口不可用时降级为一条 warning，不影响其余结果
- lockfile v1 没有 `packages` 字段，依赖链会退回按包名聚合计算，同名多版本时可能不够精确

## 开发

```bash
pnpm test                     # 运行全部测试（node:test）
pnpm test:update-snapshots    # 更新报告快照
```

目录结构：

```
src/
├── mcpServer.js        # MCP 工具定义与 stdio 启动
├── entry/              # 用例编排：解析 → lock → 审计 → 渲染
├── parseProject/       # 本地/远程 package.json 解析
├── generateLock/       # lockfile 复用与生成
├── audit/              # npm audit、规范化、依赖图、工程自身漏洞
├── render/             # EJS 模板与 markdown 输出
├── workDir/            # 临时工作目录（os.tmpdir）
└── common/             # 命令执行等基础设施
```

## License

ISC
