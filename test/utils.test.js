import test from 'node:test';
import assert from 'node:assert/strict';
import { runCommand, uniqueId } from '../src/common/utils.js';

test('runCommand 返回命令的 stdout', async () => {
  const stdout = await runCommand('echo hello', import.meta.dirname);
  assert.equal(stdout.trim(), 'hello');
});

test('runCommand 在命令失败时抛出错误', async () => {
  await assert.rejects(
    () => runCommand('node -e "process.exit(3)"', import.meta.dirname),
    /Command failed|exit code/i
  );
});

test('uniqueId 生成不重复的标识', () => {
  const ids = new Set(Array.from({ length: 1000 }, () => uniqueId()));
  assert.equal(ids.size, 1000);
});
