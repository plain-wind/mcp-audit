import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditPackage } from '../src/entry/index.js';

test('审计中途失败时工作目录仍会被清理', async () => {
  const sandbox = await mkdtemp(join(tmpdir(), 'mcp-audit-sandbox-'));
  const originalTmpDir = process.env.TMPDIR;
  // 把工作目录重定向到沙箱，便于断言；Node 的 os.tmpdir() 每次调用都会读取该变量
  process.env.TMPDIR = sandbox;

  try {
    await assert.rejects(
      () => auditPackage(join(sandbox, 'missing-project'), join(sandbox, 'out.md')),
      { code: 'ENOENT' }
    );

    assert.deepEqual(await readdir(sandbox), [], '失败后不应留下临时目录');
  } finally {
    if (originalTmpDir === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = originalTmpDir;
    await rm(sandbox, { recursive: true, force: true });
  }
});
