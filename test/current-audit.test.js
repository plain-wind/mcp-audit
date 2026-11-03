import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { currentAudit } from '../src/audit/currentAudit.js';

function startServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      resolve({
        server,
        endpoint: `http://127.0.0.1:${server.address().port}/audit`,
      });
    });
  });
}

test('没有 name/version 时直接返回 null，不发起网络请求', async () => {
  assert.equal(await currentAudit(undefined, '1.0.0'), null);
  assert.equal(await currentAudit('demo', undefined), null);
});

test('接口返回非 2xx 时抛出可读错误', async () => {
  const { server, endpoint } = await startServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('boom');
  });

  try {
    await assert.rejects(
      () => currentAudit('demo', '1.0.0', { endpoint }),
      /500/
    );
  } finally {
    server.close();
  }
});

test('只有 info 级别的公告时不当作安全漏洞', async () => {
  const { server, endpoint } = await startServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        advisories: {
          1: { id: 1, title: 'note', severity: 'info', vulnerable_versions: '*' },
        },
      })
    );
  });

  try {
    assert.equal(await currentAudit('demo', '1.0.0', { endpoint }), null);
  } finally {
    server.close();
  }
});

test('多个公告取最高严重级别，且补上工程自身这一项', async () => {
  const { server, endpoint } = await startServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        advisories: {
          1: { id: 1, title: 'low one', severity: 'low', vulnerable_versions: '<2' },
          2: { id: 2, title: 'high one', severity: 'high', vulnerable_versions: '<2' },
        },
      })
    );
  });

  try {
    const result = await currentAudit('demo', '1.0.0', { endpoint });

    assert.equal(result.name, 'demo');
    assert.equal(result.severity, 'high');
    assert.equal(result.nodes[0], '.');
    assert.deepEqual(result.depChains, []);
    assert.equal(result.problems.length, 2);
  } finally {
    server.close();
  }
});
