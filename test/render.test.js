import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/render/index.js';
import { matchSnapshot } from './lib/snapshot.js';

const packageJson = { name: 'demo-site', version: '1.0.0' };

const auditResult = {
  lockSource: 'project',
  warnings: ['无法获取工程自身发布版本的漏洞信息：request timeout'],
  summary: { total: 3, advisories: 3, critical: 1, high: 1, moderate: 1, low: 0 },
  vulnerabilities: {
    critical: [
      {
        name: 'lodash',
        severity: 'critical',
        isDirect: true,
        fixAvailable: { name: 'lodash', version: '4.17.21', isSemVerMajor: false },
        problems: [
          {
            source: 1065,
            title: 'Prototype Pollution in lodash',
            url: 'https://github.com/advisories/GHSA-xxxx',
            severity: 'critical',
            range: '<4.17.21',
          },
        ],
        nodes: ['node_modules/lodash'],
        depChains: [['lodash']],
      },
    ],
    high: [
      {
        name: 'demo-site',
        severity: 'high',
        isDirect: false,
        fixAvailable: false,
        problems: [
          {
            source: 9999,
            title: 'Demo project own advisory',
            url: 'https://github.com/advisories/GHSA-yyyy',
            severity: 'high',
            range: '<2.0.0',
          },
        ],
        nodes: ['.'],
        depChains: [],
      },
    ],
    moderate: [
      {
        name: 'minimatch',
        severity: 'moderate',
        isDirect: false,
        fixAvailable: { name: 'minimatch', version: '3.1.2', isSemVerMajor: true },
        problems: [
          {
            source: 7777,
            title: 'minimatch ReDoS <script>alert(1)</script>',
            url: 'https://github.com/advisories/GHSA-zzzz',
            severity: 'moderate',
            range: '<3.0.5',
          },
        ],
        nodes: ['node_modules/ejs/node_modules/minimatch'],
        depChains: [['ejs', 'jake', 'minimatch']],
      },
    ],
    low: [],
  },
};

test('渲染出的 markdown 与快照一致', async () => {
  const markdown = await render(auditResult, packageJson, {
    projectRoot: '/demo/project',
  });
  await matchSnapshot('report.md', markdown);
});

test('报告里包含修复建议、绝对路径和统计口径说明', async () => {
  const markdown = await render(auditResult, packageJson, {
    projectRoot: '/demo/project',
  });

  assert.match(markdown, /修复建议：升级到 lodash@4\.17\.21/);
  assert.match(markdown, /修复建议：暂无可用修复/);
  assert.match(markdown, /跨大版本/);
  assert.match(markdown, /\/demo\/project\/node_modules\/lodash/);
  assert.match(markdown, /漏洞条目/);
});
