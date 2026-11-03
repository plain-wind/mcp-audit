const DEFAULT_ENDPOINT = 'https://registry.npmjs.org/-/npm/v1/security/audits';
const DEFAULT_TIMEOUT = 15_000;

/**
 * 查询某个已发布包自身的安全公告。
 *
 * 说明：npm audit 只报告依赖树里的包，不会报告工程自身；
 * 这里通过 npm 的漏洞接口补上"工程自己"这一项。
 *
 * @param {string} packageName
 * @param {string} packageVersion
 * @param {{endpoint?: string, timeout?: number}} [options]
 */
export async function remoteAudit(
  packageName,
  packageVersion,
  { endpoint = DEFAULT_ENDPOINT, timeout = DEFAULT_TIMEOUT } = {}
) {
  const body = {
    name: 'example-audit', // 接口要求字段，内容无意义
    version: '1.0.0',
    requires: {
      [packageName]: packageVersion,
    },
    dependencies: {
      [packageName]: {
        version: packageVersion,
      },
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    throw new Error(
      `npm 漏洞接口返回 ${response.status} ${response.statusText}`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error('npm 漏洞接口返回的内容不是合法 JSON');
  }
}
