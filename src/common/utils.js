import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// npm install / npm audit 在大型工程上可能较慢，给足 5 分钟
const DEFAULT_TIMEOUT = 300_000;
// npm audit --json 的输出可能很大，默认 64MB，避免 exec 的 1MB maxBuffer 崩溃
const MAX_OUTPUT = 64 * 1024 * 1024;

/**
 * 执行命令并返回完整结果，不因非零退出码抛错。
 * @param {string} command 要执行的命令（经 shell 解释）
 * @param {string} cwd 工作目录
 * @param {{timeout?: number, maxOutput?: number}} [options]
 * @returns {Promise<{code: number, signal: string|null, stdout: string, stderr: string}>}
 */
export function runCommandResult(
  command,
  cwd,
  { timeout = DEFAULT_TIMEOUT, maxOutput = MAX_OUTPUT } = {}
) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(command, {
        cwd,
        shell: true,
        // 独立进程组，超时/超限时可以连同 shell 启动的子进程一起杀掉
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      reject(err);
      return;
    }

    const stdout = [];
    const stderr = [];
    let bytes = 0;
    let timedOut = false;
    let overflowed = false;
    let settled = false;
    let killTimer;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const killTree = (signal = 'SIGKILL') => {
      if (process.platform === 'win32') {
        child.kill(signal);
        return;
      }
      try {
        // detached 后子进程是组长，负 pid 表示整个进程组
        process.kill(-child.pid, signal);
      } catch {
        child.kill(signal);
      }
    };

    const timer = setTimeout(() => {
      timedOut = true;
      killTree('SIGTERM');
      // 进程忽略 SIGTERM 时兜底强杀，避免调用方永久挂起
      killTimer = setTimeout(() => killTree('SIGKILL'), 2_000);
      killTimer.unref?.();
      finish(reject, new Error(`命令执行超时（${timeout}ms 未完成）：${command}`));
    }, timeout);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      if (timedOut || overflowed) return;
      bytes += Buffer.byteLength(chunk, 'utf8');
      if (bytes > maxOutput) {
        overflowed = true;
        killTree('SIGKILL');
        return;
      }
      stdout.push(chunk);
    });
    child.stderr.on('data', (chunk) => {
      // stderr 只用于报错信息，保留末尾一段即可
      stderr.push(chunk);
      if (stderr.length > 200) stderr.shift();
    });

    child.on('error', (err) => {
      finish(reject, new Error(`命令启动失败：${command}\n${err.message}`));
    });

    child.on('close', (code, signal) => {
      if (timedOut) {
        finish(reject, new Error(`命令执行超时（${timeout}ms 未完成）：${command}`));
        return;
      }
      if (overflowed) {
        finish(reject, new Error(`命令输出超过 ${maxOutput} 字节上限：${command}`));
        return;
      }
      finish(resolve, {
        code: code ?? -1,
        signal,
        stdout: stdout.join(''),
        stderr: stderr.join(''),
      });
    });
  });
}

/**
 * 执行命令，非零退出码视为失败并抛错；成功时返回 stdout。
 */
export async function runCommand(command, cwd, options) {
  const { code, stdout, stderr } = await runCommandResult(
    command,
    cwd,
    options
  );
  if (code !== 0) {
    const detail = (stderr.trim() || stdout.trim())
      .split('\n')
      .slice(0, 20)
      .join('\n');
    throw new Error(
      `命令执行失败（exit code ${code}）：${command}${detail ? `\n${detail}` : ''}`
    );
  }
  return stdout;
}

export function uniqueId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function getFilename(importMetaUrl) {
  return fileURLToPath(importMetaUrl);
}

export function getDirname(importMetaUrl) {
  return dirname(getFilename(importMetaUrl));
}
