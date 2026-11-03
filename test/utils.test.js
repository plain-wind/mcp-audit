import test from 'node:test';
import assert from 'node:assert/strict';
import { runCommand, runCommandResult, uniqueId } from '../src/common/utils.js';

const cwd = import.meta.dirname;

test('runCommand 返回命令的 stdout', async () => {
  const stdout = await runCommand('echo hello', cwd);
  assert.equal(stdout.trim(), 'hello');
});

test('runCommand 在命令失败时抛出错误', async () => {
  await assert.rejects(
    () => runCommand('node -e "process.exit(3)"', cwd),
    /exit code 3/i
  );
});

test('runCommandResult 保留退出码，不因非零退出码抛错', async () => {
  const result = await runCommandResult(
    'node -e "console.error(\'boom\'); process.exit(3)"',
    cwd
  );

  assert.equal(result.code, 3);
  assert.match(result.stderr, /boom/);
});

test('失败命令即使有 stdout 也必须抛错（不再被静默当成成功）', async () => {
  await assert.rejects(
    () => runCommand('node -e "console.log(\'partial\'); process.exit(2)"', cwd),
    /exit code 2/i
  );
});

test('超过 1MB 的输出不会被截断或打断', async () => {
  const result = await runCommandResult(
    'node -e "process.stdout.write(\'x\'.repeat(3 * 1024 * 1024))"',
    cwd
  );

  assert.equal(result.code, 0);
  assert.equal(result.stdout.length, 3 * 1024 * 1024);
});

test('输出超过上限时报错并终止命令', async () => {
  await assert.rejects(
    () =>
      runCommandResult('node -e "process.stdout.write(\'x\'.repeat(3 * 1024 * 1024))"', cwd, {
        maxOutput: 1024,
      }),
    /超过 .* 字节上限/
  );
});

test('超时会终止命令并抛错', async () => {
  const startedAt = Date.now();

  await assert.rejects(
    () => runCommand('node -e "setTimeout(() => {}, 10000)"', cwd, { timeout: 300 }),
    /超时/
  );
  assert.ok(Date.now() - startedAt < 5_000, '超时后应立即返回');
});

test('不存在的命令会抛错而不是静默通过', async () => {
  await assert.rejects(() => runCommand('definitely-not-a-command-xyz', cwd), /exit code/i);
});

test('uniqueId 生成不重复的标识', () => {
  const ids = new Set(Array.from({ length: 1000 }, () => uniqueId()));
  assert.equal(ids.size, 1000);
});
