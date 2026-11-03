import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createWorkDir, deleteWorkDir } from '../src/workDir/index.js';

test('createWorkDir 在系统临时目录下创建工作目录', async () => {
  const dir = await createWorkDir();
  try {
    assert.ok(dir.startsWith(tmpdir()), `工作目录应位于 ${tmpdir()}，实际为 ${dir}`);
    assert.ok((await stat(dir)).isDirectory());
  } finally {
    await deleteWorkDir(dir);
  }
});

test('创建工作目录不会污染项目目录', () => {
  const projectWorkDir = join(import.meta.dirname, '..', 'work');
  assert.equal(existsSync(projectWorkDir), false, '不应再在包目录下创建 work/');
});

test('deleteWorkDir 幂等，目录不存在也不抛错', async () => {
  await deleteWorkDir(join(tmpdir(), `mcp-audit-missing-${Date.now()}`));
  await deleteWorkDir(undefined);
});
