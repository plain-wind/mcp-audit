import { getDepChains } from './getDepChain.js';
import { assertAuditReport, getSeverityBucket } from './assertAuditReport.js';

function _normalizeVulnerabilities(auditResult) {
  const result = {
    critical: [],
    high: [],
    moderate: [],
    low: [],
  };

  for (const key in auditResult.vulnerabilities) {
    const packageInfo = auditResult.vulnerabilities[key];
    const normalizedPackage = _normalizePackage(packageInfo);
    if (normalizedPackage) {
      getSeverityBucket(
        result,
        normalizedPackage.severity,
        normalizedPackage.name
      ).push(normalizedPackage);
    }
  }
  return result;

  function _normalizePackage(packageInfo) {
    const { via = [] } = packageInfo;
    // via 中的字符串表示"经由某个脆弱依赖间接受影响"，不是该包自身的漏洞，
    // 只保留对象形式的 advisory，避免同一漏洞被重复统计
    const validVia = via.filter((it) => typeof it === 'object');
    if (validVia.length === 0) {
      return null;
    }
    const info = {
      name: packageInfo.name,
      severity: packageInfo.severity,
      problems: validVia,
      nodes: packageInfo.nodes || [],
    };
    info.depChains = getDepChains(packageInfo, auditResult.vulnerabilities);
    return info;
  }
}

export function normalizeAuditResult(auditResult) {
  assertAuditReport(auditResult);
  return {
    vulnerabilities: _normalizeVulnerabilities(auditResult),
  };
}
