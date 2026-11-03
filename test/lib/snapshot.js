import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const snapshotDir = join(dirname(fileURLToPath(import.meta.url)), '..', '__snapshots__');

/**
 * 与快照文件比对。首次生成或确认改动符合预期时，设置 UPDATE_SNAPSHOTS=1。
 */
export async function matchSnapshot(name, actual) {
  const file = join(snapshotDir, name);

  if (process.env.UPDATE_SNAPSHOTS === '1') {
    await mkdir(snapshotDir, { recursive: true });
    await writeFile(file, actual, 'utf8');
    return;
  }

  const expected = await readFile(file, 'utf8');
  assert.equal(
    actual,
    expected,
    `快照不一致：${name}。确认改动符合预期后运行 pnpm test:update-snapshots 更新。`
  );
}
