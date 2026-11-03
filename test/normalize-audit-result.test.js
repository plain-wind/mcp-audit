import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAuditResult } from '../src/audit/normalizeAuditResult.js';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

const fixturePath = join(
  import.meta.dirname,
  '..',
  'src',
  'audit',
  'test',
  'workdir',
  'audit.json'
);

async function loadNormalized() {
  const raw = JSON.parse(await readFile(fixturePath, 'utf8'));
  return normalizeAuditResult(raw);
}

test('按严重级别归类，且只统计有直接 advisory 的包', async () => {
  const { vulnerabilities } = await loadNormalized();

  assert.equal(vulnerabilities.critical.length, 4);
  assert.equal(vulnerabilities.high.length, 12);
  assert.equal(vulnerabilities.moderate.length, 3);
  assert.equal(vulnerabilities.low.length, 1);
});

test('via 中的字符串条目（间接受影响）不会进入 problems', async () => {
  const { vulnerabilities } = await loadNormalized();
  const packages = Object.values(vulnerabilities).flat();

  for (const pkg of packages) {
    assert.ok(pkg.problems.length > 0, `${pkg.name} 不应在没有直接 advisory 时被收录`);
    for (const problem of pkg.problems) {
      assert.equal(typeof problem, 'object');
      assert.ok(problem.title, 'advisory 应带有 title');
    }
  }
});

test('每条依赖链都以漏洞包自身结尾', async () => {
  const { vulnerabilities } = await loadNormalized();
  const packages = Object.values(vulnerabilities).flat();

  for (const pkg of packages) {
    assert.ok(pkg.depChains.length > 0, `${pkg.name} 应至少有一条依赖链`);
    for (const chain of pkg.depChains) {
      assert.ok(chain.length > 0, '依赖链不应为空');
      assert.equal(chain.at(-1), pkg.name);
    }
  }
});

test('npm audit 的失败结果不会被规范化成"零漏洞"', () => {
  assert.throws(
    () => normalizeAuditResult({ error: { code: 'ENOLOCK', summary: 'requires a lockfile' } }),
    /ENOLOCK/
  );
});

test('缺少 vulnerabilities 字段时抛错', () => {
  assert.throws(() => normalizeAuditResult({}), /vulnerabilities/);
});

test('未知严重级别会明确报错，而不是 TypeError 崩溃', () => {
  assert.throws(
    () =>
      normalizeAuditResult({
        vulnerabilities: {
          a: { name: 'a', severity: 'info', via: [{ title: 't' }], nodes: [] },
        },
      }),
    /未知的漏洞等级/
  );
});

