const GITHUB_HOST = 'github.com';
const TIMEOUT = 10_000;

/**
 * 解析 GitHub 仓库 URL，提取 owner、repo、ref（分支/标签/commit）和子目录。
 *
 * 支持：
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo.git
 *   - https://github.com/owner/repo/tree/<ref>
 *   - https://github.com/owner/repo/tree/<ref>/packages/sub（monorepo 子目录）
 *   - https://github.com/owner/repo/blob/<ref>/package.json
 *
 * @returns {{owner: string, repo: string, ref: string|null, subPath: string}}
 * @throws {Error} URL 不合法或不是 github.com
 */
export function parseGithubUrl(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`无效的仓库地址：${url}`);
  }

  if (parsedUrl.hostname !== GITHUB_HOST) {
    throw new Error('目前只支持 github.com 的仓库地址');
  }

  const parts = parsedUrl.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`无效的 GitHub 仓库地址：${url}`);
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, '');
  const rest = parts.slice(2);

  // /tree/<ref>/... 与 /blob/<ref>/... 的第三段是 ref
  if ((rest[0] === 'tree' || rest[0] === 'blob') && rest.length >= 2) {
    return {
      owner,
      repo,
      ref: decodeURIComponent(rest[1]),
      subPath: rest.slice(2).join('/'),
    };
  }

  // /owner/repo/<subPath> 这种省略 ref 的写法按默认分支处理
  return { owner, repo, ref: null, subPath: rest.join('/') };
}

async function getDefaultBranch(owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    throw new Error(
      `无法获取仓库信息（${response.status}）：${owner}/${repo}，仓库不存在或无权访问`
    );
  }

  const info = await response.json();
  if (!info.default_branch) {
    throw new Error(`仓库信息中缺少 default_branch：${owner}/${repo}`);
  }
  return info.default_branch;
}

/**
 * 从 GitHub 读取仓库（或子目录）里的 package.json。
 *
 * raw.githubusercontent.com 的 ref 直接支持分支名、标签和 commit，
 * 不需要再区分 tags/ 与 heads/。
 */
export async function parseRemoteProject(githubUrl) {
  const { owner, repo, ref, subPath } = parseGithubUrl(githubUrl);
  const branch = ref || (await getDefaultBranch(owner, repo));

  const path = [subPath, 'package.json'].filter(Boolean).join('/');
  const packageJsonUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  const response = await fetch(packageJsonUrl, {
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!response.ok) {
    throw new Error(
      `无法读取 ${owner}/${repo} 的 package.json（${response.status}）：${packageJsonUrl}`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`${packageJsonUrl} 返回的内容不是合法 JSON`);
  }
}
