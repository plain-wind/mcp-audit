import fs from 'node:fs';
import { join, basename } from 'node:path';
import { runCommand } from '../common/utils.js';

// 优先使用项目的 npm-shrinkwrap.json（npm 官方优先级高于 package-lock.json）
const LOCK_FILES = ['npm-shrinkwrap.json', 'package-lock.json'];

// --no-audit/--no-fund 减少无关网络请求；--ignore-scripts 避免执行第三方脚本；
// 不用 --force（它会掩盖版本冲突并悄悄改变解析结果），
// 改用 --legacy-peer-deps 让解析行为可预期
const INSTALL_CMD =
  'npm install --package-lock-only --no-audit --no-fund --ignore-scripts --legacy-peer-deps';

async function writePackageJson(workDir, packageJson) {
  await fs.promises.writeFile(
    join(workDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );
}

async function findProjectLockFile(projectRoot) {
  if (!projectRoot) return null;

  for (const name of LOCK_FILES) {
    const candidate = join(projectRoot, name);
    try {
      await fs.promises.access(candidate);
      return candidate;
    } catch {
      // 继续尝试下一个
    }
  }
  return null;
}

/**
 * 为审计准备工作目录中的 package.json 与 lockfile。
 *
 * 本地工程如果已有 lockfile，直接复用——重新解析依赖会按 semver 范围
 * 取到最新版本，和项目实际安装的版本不一致，从而漏报真实存在的漏洞。
 *
 * @returns {Promise<{source: 'project'|'generated', lockFile: string|null}>}
 */
export async function generateLock(workDir, packageJson, { projectRoot } = {}) {
  await writePackageJson(workDir, packageJson);

  const projectLockFile = await findProjectLockFile(projectRoot);
  if (projectLockFile) {
    const target = join(workDir, basename(projectLockFile));
    await fs.promises.copyFile(projectLockFile, target);
    return { source: 'project', lockFile: projectLockFile };
  }

  await runCommand(INSTALL_CMD, workDir);
  return { source: 'generated', lockFile: null };
}
