import { renderMarkdown } from './markdown.js';
import { autolink, code, fixSuggestion, formatPath, plainText } from './format.js';

const desc = {
  severityLevels: {
    low: '低危',
    moderate: '中危',
    high: '高危',
    critical: '严重',
  },
  severityOrder: ['critical', 'high', 'moderate', 'low'],
};

/**
 * 将审计结果渲染为 markdown 字符串
 * @param {object} auditResult 规范化的审计结果
 * @param {object} packageJson 包的 package.json 内容
 * @param {{projectRoot?: string|null}} [options]
 */
export async function render(auditResult, packageJson, { projectRoot = null } = {}) {
  const data = {
    audit: auditResult,
    desc,
    packageJson,
    projectRoot,
    plainText,
    code,
    autolink,
    fixSuggestion,
    formatPath: (node) => formatPath(node, projectRoot),
    countAdvisories: (packages = []) =>
      packages.reduce((sum, pkg) => sum + (pkg.problems?.length || 0), 0),
    lockSourceText: describeLockSource(auditResult.lockSource),
  };
  return normalizeMarkdown(await renderMarkdown(data));
}

/**
 * 统一空行与标题间距：EJS 模板的空白控制很容易出现
 * "标题紧跟在列表项后面"这种会改变 markdown 语义的输出。
 */
function normalizeMarkdown(markdown) {
  return (
    markdown
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
      .trimEnd() + '\n'
  );
}

function describeLockSource(lockSource) {
  if (lockSource === 'project') return '工程自带的 lockfile';
  if (lockSource === 'generated') return '按 package.json 重新解析（工程未提供 lockfile）';
  return '未知';
}
