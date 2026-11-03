import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

const WORK_PREFIX = 'mcp-audit-';

/**
 * 在系统临时目录下创建本次审计的工作目录。
 * 不用包内目录：避免污染安装位置、避免被打进 npm 包、避免只读文件系统报错。
 */
export async function createWorkDir() {
  // 每次调用时读取 os.tmpdir()，便于测试通过 TMPDIR 隔离
  return fs.promises.mkdtemp(join(os.tmpdir(), WORK_PREFIX));
}

/**
 * 删除工作目录。目录已不存在时静默返回，便于放在 finally 中调用。
 */
export async function deleteWorkDir(workDir) {
  if (!workDir) return;
  await fs.promises.rm(workDir, {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
}
