import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubUrl } from '../src/parseProject/parseRemoteProject.js';

test('解析仓库根地址', () => {
  assert.deepEqual(parseGithubUrl('https://github.com/webpack/webpack'), {
    owner: 'webpack',
    repo: 'webpack',
    ref: null,
    subPath: '',
  });
});

test('去掉仓库地址结尾的 .git', () => {
  assert.deepEqual(parseGithubUrl('https://github.com/expressjs/express.git'), {
    owner: 'expressjs',
    repo: 'express',
    ref: null,
    subPath: '',
  });
});

test('/tree/<分支> 的 ref 原样保留，不再硬编码成 tag', () => {
  assert.deepEqual(parseGithubUrl('https://github.com/webpack/webpack/tree/main'), {
    owner: 'webpack',
    repo: 'webpack',
    ref: 'main',
    subPath: '',
  });

  assert.deepEqual(parseGithubUrl('https://github.com/webpack/webpack/tree/v4.9.3'), {
    owner: 'webpack',
    repo: 'webpack',
    ref: 'v4.9.3',
    subPath: '',
  });
});

test('支持 monorepo 子目录', () => {
  assert.deepEqual(
    parseGithubUrl('https://github.com/vuejs/core/tree/main/packages/reactivity'),
    {
      owner: 'vuejs',
      repo: 'core',
      ref: 'main',
      subPath: 'packages/reactivity',
    }
  );
});

test('拒绝非 github.com 或残缺的地址', () => {
  assert.throws(() => parseGithubUrl('https://gitlab.com/owner/repo'), /只支持 github.com/);
  assert.throws(() => parseGithubUrl('https://github.com/onlyowner'), /无效/);
  assert.throws(() => parseGithubUrl('not a url'), /无效/);
});
