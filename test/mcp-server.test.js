import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcpServer.js';

async function connect() {
  const server = createMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(clientTransport);

  return { client, server };
}

test('对外暴露 auditPackage，且 savePath 是可选参数', async () => {
  const { client, server } = await connect();
  try {
    const { tools } = await client.listTools();
    const tool = tools.find((item) => item.name === 'auditPackage');

    assert.ok(tool, '应注册 auditPackage 工具');
    assert.deepEqual(tool.inputSchema.required, ['projectRoot']);
    assert.match(tool.description, /markdown/, '描述应说明返回 markdown 报告');
  } finally {
    await client.close();
    await server.close();
  }
});

test('审计失败时返回 isError 和可读原因，而不是让客户端超时', async () => {
  const { client, server } = await connect();
  try {
    const result = await client.callTool({
      name: 'auditPackage',
      arguments: { projectRoot: '/tmp/mcp-audit-definitely-missing-project' },
    });

    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /审计失败/);
    assert.match(result.content[0].text, /ENOENT|no such file/);
  } finally {
    await client.close();
    await server.close();
  }
});
