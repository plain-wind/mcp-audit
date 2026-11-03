import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildLockGraph } from '../src/audit/lockGraph.js';

const fixtureLockPath = join(
  import.meta.dirname,
  '..',
  'src',
  'audit',
  'test',
  'workdir',
  'package-lock.json'
);

// 同名不同版本：x@3 挂在 a 下面，x@2 被提升到顶层供 z 使用
const multiVersion = {
  '': { name: 'demo', dependencies: { a: '1.0.0', z: '1.0.0' } },
  'node_modules/a': { name: 'a', version: '1.0.0', dependencies: { x: '3.0.0' } },
  'node_modules/a/node_modules/x': {
    name: 'x',
    version: '3.0.0',
    dependencies: { y: '1.0.0' },
  },
  'node_modules/a/node_modules/x/node_modules/y': { name: 'y', version: '1.0.0' },
  'node_modules/z': { name: 'z', version: '1.0.0', dependencies: { x: '2.0.0' } },
  'node_modules/x': { name: 'x', version: '2.0.0' },
};

test('同名不同版本的包各自得到正确的依赖链', () => {
  const graph = buildLockGraph(multiVersion);

  assert.deepEqual(graph.chainsTo(['node_modules/a/node_modules/x']), [['a', 'x']]);
  assert.deepEqual(graph.chainsTo(['node_modules/x']), [['z', 'x']]);
});

test('嵌套依赖按实际安装路径向上解析', () => {
  const graph = buildLockGraph(multiVersion);

  assert.deepEqual(graph.chainsTo(['node_modules/a/node_modules/x/node_modules/y']), [
    ['a', 'x', 'y'],
  ]);
});

test('根工程的 devDependencies 也会被当作依赖链起点', () => {
  const graph = buildLockGraph({
    '': { devDependencies: { 'lint-tool': '1.0.0' } },
    'node_modules/lint-tool': { name: 'lint-tool', version: '1.0.0' },
  });

  assert.deepEqual(graph.chainsTo(['node_modules/lint-tool']), [['lint-tool']]);
});

test('用真实的 package-lock.json 计算依赖链', async () => {
  const lock = JSON.parse(await readFile(fixtureLockPath, 'utf8'));
  const graph = buildLockGraph(lock.packages);

  assert.deepEqual(graph.chainsTo(['node_modules/ejs']), [
    ['@vue/cli-service', 'webpack-bundle-analyzer', 'ejs'],
  ]);
});

test('未知安装路径返回空链，不抛错', () => {
  const graph = buildLockGraph(multiVersion);
  assert.deepEqual(graph.chainsTo(['node_modules/not-installed']), []);
  assert.deepEqual(graph.chainsTo([]), []);
});

test('旧版（无 packages 字段）lockfile 返回 null，由调用方回退', () => {
  assert.equal(buildLockGraph(undefined), null);
  assert.equal(buildLockGraph({}), null);
});
