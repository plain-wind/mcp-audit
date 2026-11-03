import { createWorkDir, deleteWorkDir } from '../workDir/index.js';
import { parseProject, isRemoteProject } from '../parseProject/index.js';
import { generateLock } from '../generateLock/index.js';
import { audit } from '../audit/index.js';
import { render } from '../render/index.js';
import fs from 'node:fs';

/**
 * 根据项目根目录，审计项目中所有的包（含项目本身）
 * @param {string} projectRoot 项目根目录，可以是本地目录的绝对路径，也可以是远程仓库的URL
 * @param {string} savePath 保存审计结果的文件名，审计结果是一个标准格式的markdown字符串
 */
export async function auditPackage(projectRoot, savePath) {
  // 工作目录必须在 finally 中清理：任何一步失败（解析、install、audit、写报告）都不留垃圾
  const workDir = await createWorkDir();

  try {
    // 1. 解析项目，向工作目录添加 package.json
    const packageJson = await parseProject(projectRoot);

    // 2. 准备 lockfile：本地工程优先复用已有的 lock，
    //    否则按 package.json 的 semver 范围重新解析（可能和实际安装版本不一致）
    let lock = await generateLock(workDir, packageJson, {
      projectRoot: isRemoteProject(projectRoot) ? null : projectRoot,
    });

    // 3. 审计；项目自带 lock 不可用时（版本过旧、workspaces 目录缺失等）回退到重新解析
    let auditResult;
    try {
      auditResult = await audit(workDir, packageJson);
    } catch (err) {
      if (lock.source !== 'project') throw err;
      console.warn(
        `[mcp-audit] 复用项目 lockfile 审计失败，改为按 package.json 重新解析依赖：${err.message}`
      );
      lock = await generateLock(workDir, packageJson);
      auditResult = await audit(workDir, packageJson);
    }
    auditResult.lockSource = lock.source;

    // 4. 渲染审计结果
    const renderedResult = await render(auditResult, packageJson);
    // 5. 将结果保存到指定路径
    await fs.promises.writeFile(savePath, renderedResult);
  } finally {
    await deleteWorkDir(workDir);
  }
}
