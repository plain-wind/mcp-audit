import { npmAudit } from './npmAudit.js';
import { normalizeAuditResult } from './normalizeAuditResult.js';
import { currentAudit } from './currentAudit.js';
import { getSeverityBucket } from './assertAuditReport.js';
import { readLockGraph } from './lockGraph.js';

export async function audit(workDir, packageJson) {
  const warnings = [];

  // 调用 npmAudit 获取审计结果
  const auditResult = await npmAudit(workDir);
  // 用工作目录里的 lockfile 构建依赖图，得到准确的多版本依赖链
  const lockGraph = await readLockGraph(workDir);
  // 规范化审计结果
  const normalizedResult = normalizeAuditResult(auditResult, { lockGraph });

  // 补充工程自身的漏洞：npm audit 不覆盖工程自己
  let current = null;
  try {
    current = await currentAudit(packageJson.name, packageJson.version);
  } catch (err) {
    // 工程自身的漏洞信息是增量信息，接口不可用时不应让整份报告失败
    warnings.push(`无法获取工程自身发布版本的漏洞信息：${err.message}`);
  }
  if (current) {
    getSeverityBucket(
      normalizedResult.vulnerabilities,
      current.severity,
      current.name
    ).unshift(current);
  }

  // 添加汇总信息：区分"受影响的依赖包"和"漏洞条目"
  const allPackages = Object.values(normalizedResult.vulnerabilities).flat();
  normalizedResult.summary = {
    total: allPackages.length,
    advisories: allPackages.reduce((sum, item) => sum + item.problems.length, 0),
    critical: normalizedResult.vulnerabilities.critical.length,
    high: normalizedResult.vulnerabilities.high.length,
    moderate: normalizedResult.vulnerabilities.moderate.length,
    low: normalizedResult.vulnerabilities.low.length,
  };
  normalizedResult.warnings = warnings;
  return normalizedResult;
}
