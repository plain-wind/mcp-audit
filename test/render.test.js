import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/render/index.js';
import { matchSnapshot } from './lib/snapshot.js';

const packageJson = { name: 'demo-site', version: '1.0.0' };

const auditResult = {
  summary: { total: 3, critical: 1, high: 1, moderate: 1, low: 0 },
  vulnerabilities: {
    critical: [
      {
        name: 'lodash',
        severity: 'critical',
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
        problems: [
          {
            source: 7777,
            title: 'minimatch ReDoS',
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
  const markdown = await render(auditResult, packageJson);
  await matchSnapshot('report.md', markdown);
});
