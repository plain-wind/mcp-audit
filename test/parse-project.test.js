import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { parseProject } from '../src/parseProject/index.js';

test('parseProject 读取本地工程的 package.json', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mcp-audit-parse-'));
  try {
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'demo', version: '1.0.0' }),
      'utf8'
    );

    const pkg = await parseProject(dir);

    assert.equal(pkg.name, 'demo');
    assert.equal(pkg.version, '1.0.0');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('parseProject 在 package.json 缺失时抛出错误', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mcp-audit-parse-'));
  try {
    await assert.rejects(() => parseProject(dir), { code: 'ENOENT' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
