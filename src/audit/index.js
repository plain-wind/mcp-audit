import { npmAudit } from './npmAudit.js';
import { normalizeAuditResult } from './normalizeAuditResult.js';
import { currentAudit } from './currentAudit.js';
import { getSeverityBucket } from './assertAuditReport.js';
import { readLockGraph } from './lockGraph.js';

export async function audit(workDir, packageJson) {
  // 调用 npmAudit 获取审计结果
  const auditResult = await npmAudit(workDir);
  // 用工作目录里的 lockfile 构建依赖图，得到准确的多版本依赖链
  const lockGraph = await readLockGraph(workDir);
  // 规范化审计结果
  const normalizedResult = normalizeAuditResult(auditResult, { lockGraph });

  // 添加当前工程的审计结果
  const current = await currentAudit(packageJson.name, packageJson.version);
  if (current) {
    getSeverityBucket(
      normalizedResult.vulnerabilities,
      current.severity,
      current.name
    ).unshift(current);
  }
  // 添加汇总信息
  normalizedResult.summary = {
    total: Object.values(normalizedResult.vulnerabilities).reduce(
      (sum, arr) => sum + arr.length,
      0
    ),
    critical: normalizedResult.vulnerabilities.critical.length,
    high: normalizedResult.vulnerabilities.high.length,
    moderate: normalizedResult.vulnerabilities.moderate.length,
    low: normalizedResult.vulnerabilities.low.length,
  };
  return normalizedResult;
}
