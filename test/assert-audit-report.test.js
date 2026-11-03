import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAuditReport } from '../src/audit/assertAuditReport.js';

test('npm audit 返回 error 对象时抛出可读错误', () => {
  assert.throws(
    () => assertAuditReport({ error: { code: 'ENOLOCK', summary: 'requires a lockfile' } }),
    /ENOLOCK.*requires a lockfile/
  );
});

test('缺少 vulnerabilities 字段时抛错', () => {
  assert.throws(() => assertAuditReport({}), /vulnerabilities/);
  assert.throws(() => assertAuditReport(null), /vulnerabilities/);
  assert.throws(() => assertAuditReport({ vulnerabilities: null }), /vulnerabilities/);
});

test('正常的 audit 报告可以通过校验', () => {
  assert.doesNotThrow(() => assertAuditReport({ auditReportVersion: 2, vulnerabilities: {} }));
});
