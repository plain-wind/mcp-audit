import { runCommandResult } from '../common/utils.js';

/**
 * 在指定目录执行 npm audit，返回解析后的 JSON。
 *
 * npm audit 发现漏洞时退出码为 1（这是正常结果，不是失败），
 * 只有真正的执行失败（如没有 lockfile）才抛错。
 */
export async function npmAudit(workDir, { timeout } = {}) {
  const { code, stdout, stderr } = await runCommandResult('npm audit --json', workDir, {
    timeout,
  });

  if (!stdout.trim()) {
    throw new Error(
      `npm audit 没有产生任何输出（exit code ${code}）${stderr ? `：\n${stderr.trim()}` : ''}`
    );
  }
  if (code !== 0 && code !== 1) {
    throw new Error(
      `npm audit 执行失败（exit code ${code}）：\n${(stderr || stdout).trim()}`
    );
  }

  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(
      `npm audit 的输出不是合法 JSON（exit code ${code}）：\n${stdout.slice(0, 500)}`
    );
  }
}
