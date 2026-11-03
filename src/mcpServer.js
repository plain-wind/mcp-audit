#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { auditPackage } from './entry/index.js';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);

/**
 * 创建 MCP 服务实例（不建立连接），便于在测试中通过内存传输协议驱动。
 */
export function createMcpServer() {
  const server = new McpServer({
    name: 'audit-server',
    title: '前端工程安全审计服务',
    version,
  });

  server.registerTool(
    'auditPackage',
    {
      title: '审计前端工程',
      description:
        '审计前端工程的所有直接和间接依赖，得到安全审计结果。支持本地工程的审计，也支持远程 GitHub 仓库的审计。' +
        '工具直接返回标准格式的 markdown 报告，无需再读取文件即可展示。',
      inputSchema: {
        projectRoot: z
          .string()
          .describe('本地工程的根目录绝对路径，或者 GitHub 仓库的 URL 地址'),
        savePath: z
          .string()
          .optional()
          .describe(
            '可选。把审计报告另存为文件的绝对路径，父目录会自动创建；不传则只在响应中返回报告'
          ),
      },
    },
    async ({ projectRoot, savePath }) => {
      try {
        const markdown = await auditPackage(projectRoot, savePath);

        const content = [{ type: 'text', text: markdown }];
        if (savePath) {
          content.push({ type: 'text', text: `审计报告已保存到：${savePath}` });
        }
        return { content };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: `审计失败：${error.message}` }],
        };
      }
    }
  );

  return server;
}

/**
 * 以 stdio 传输启动 MCP 服务。
 */
export async function start() {
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
}

// 只有直接执行本文件时才启动服务；被测试 import 时不启动
const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entryUrl) {
  await start();
}
