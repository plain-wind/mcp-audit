import { remoteAudit } from './remoteAudit.js';

const SEVERITY_LEVELS = ['low', 'moderate', 'high', 'critical'];

/**
 * 查询工程自身（npm 上已发布版本）的漏洞。
 * 没有 name/version（如 workspace 根包）或没有发布版本时返回 null。
 *
 * @param {string} name
 * @param {string} version
 * @param {{endpoint?: string, timeout?: number}} [options]
 * @returns {Promise<Object|null>}
 */
export async function currentAudit(name, version, options) {
  if (!name || !version) return null;

  const auditResult = await remoteAudit(name, version, options);
  const advisories = Object.values(auditResult?.advisories || {}).filter(
    (advisory) => SEVERITY_LEVELS.includes(advisory.severity)
  );
  if (advisories.length === 0) return null;

  const result = {
    name,
    range: version,
    nodes: ['.'],
    depChains: [],
    problems: [],
  };

  let maxSeverity = 'low';
  for (const advisory of advisories) {
    result.problems.push({
      source: advisory.id,
      name,
      dependency: name,
      title: advisory.title,
      url: advisory.url,
      severity: advisory.severity,
      cwe: advisory.cwe,
      cvss: advisory.cvss,
      range: advisory.vulnerable_versions,
    });

    if (
      SEVERITY_LEVELS.indexOf(advisory.severity) >
      SEVERITY_LEVELS.indexOf(maxSeverity)
    ) {
      maxSeverity = advisory.severity;
    }
  }

  result.severity = maxSeverity;
  return result;
}
