const KNOWN_SEVERITIES = ['critical', 'high', 'moderate', 'low'];

/**
 * 校验 npm audit 的返回结果。
 *
 * 之前这里直接遍历 auditResult.vulnerabilities：当 npm audit 失败时
 * （例如没有 lockfile 返回 {"error": {...}}），for...in 会静默空转，
 * 最终把"审计失败"渲染成"没有任何风险漏洞"。
 */
export function assertAuditReport(report) {
  if (report && typeof report === 'object' && report.error) {
    const { code, summary, detail } = report.error;
    throw new Error(
      `npm audit 执行失败${code ? `（${code}）` : ''}：${summary || detail || '未知错误'}`
    );
  }

  if (
    !report ||
    typeof report !== 'object' ||
    !report.vulnerabilities ||
    typeof report.vulnerabilities !== 'object'
  ) {
    throw new Error(
      'npm audit 返回结果中缺少 vulnerabilities 字段，无法判断漏洞情况。' +
        '常见原因是 lockfile 缺失或 npm 版本不兼容。'
    );
  }
}

/**
 * 取某个严重级别对应的桶；遇到未知级别时明确报错，避免静默丢弃或崩溃。
 */
export function getSeverityBucket(vulnerabilities, severity, packageName) {
  if (!KNOWN_SEVERITIES.includes(severity)) {
    throw new Error(
      `未知的漏洞等级 "${severity}"（包：${packageName}），npm audit 报告格式可能已变化`
    );
  }
  return vulnerabilities[severity];
}
