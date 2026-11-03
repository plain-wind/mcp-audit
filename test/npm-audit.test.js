import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { npmAudit } from '../src/audit/npmAudit.js';

test('没有 lockfile 时抛出明确错误，而不是返回空结果', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mcp-audit-nolock-'));
  try {
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'no-lock', version: '1.0.0', dependencies: {} }),
      'utf8'
    );

    await assert.rejects(() => npmAudit(dir, { timeout: 60_000 }), /ENOLOCK|lockfile/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
