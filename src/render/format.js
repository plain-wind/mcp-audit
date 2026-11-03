const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/**
 * 把来自 npm 的文本压成单行，并处理会破坏 markdown 结构或注入 HTML 的字符。
 * advisory 的标题/URL 属于外部数据，不能原样拼进报告。
 *
 * 注意：版本范围（如 <4.17.21）必须保留尖括号，所以这里只用于纯文本；
 * 版本号、路径等会走 code()，放在行内代码里尖括号是安全的。
 */
export function plainText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(CONTROL_CHARS, ' ')
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/\|/g, '｜')
    .replace(/`/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** 行内代码，用于包名、版本号、路径等；保留尖括号。 */
export function code(value) {
  if (value === null || value === undefined) return '';
  const text = String(value)
    .replace(CONTROL_CHARS, ' ')
    .replace(/`/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text ? `\`${text}\`` : '';
}

/** markdown 自动链接形式，避免 URL 中的括号等字符破坏排版。 */
export function autolink(value) {
  if (value === null || value === undefined) return '';
  const text = String(value)
    .replace(CONTROL_CHARS, '')
    .replace(/[<>\s]/g, '')
    .trim();
  return /^https?:\/\//i.test(text) ? `<${text}>` : plainText(value);
}

/** 把 lockfile 中的安装路径还原成用户工程里的绝对路径。 */
export function formatPath(node, projectRoot) {
  if (!node) return '';
  if (node === '.') return projectRoot || '工程根目录';
  if (!projectRoot) return node;
  return `${projectRoot.replace(/\/+$/, '')}/${node}`;
}

/** npm audit 给出的修复建议。 */
export function fixSuggestion(fixAvailable) {
  if (!fixAvailable) return '暂无可用修复';
  if (fixAvailable === true) return '可用 `npm audit fix` 修复';

  const { name, version, isSemVerMajor } = fixAvailable;
  if (!name) return '暂无可用修复';
  const target = version ? `${name}@${version}` : name;
  return isSemVerMajor
    ? `升级到 ${target}（跨大版本，需评估兼容性）`
    : `升级到 ${target}`;
}
