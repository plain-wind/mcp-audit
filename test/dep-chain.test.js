import test from 'node:test';
import assert from 'node:assert/strict';
import { getDepChains } from '../src/audit/getDepChain.js';

function normalize(chains) {
  return chains.map((chain) => chain.join(' > ')).sort();
}

// effects 指向"依赖了当前包的包"，即向上（朝工程根）走
const diamond = {
  A: { name: 'A', effects: [] },
  B: { name: 'B', effects: ['A'] },
  C: { name: 'C', effects: ['A'] },
  D: { name: 'D', effects: ['B', 'C'] },
};

test('从漏洞节点向上走到顶层依赖，枚举所有路径', () => {
  assert.deepEqual(normalize(getDepChains(diamond.D, diamond)), [
    'A > B > D',
    'A > C > D',
  ]);
});

test('遇到环时在环上终止，不会无限递归', () => {
  const cyclic = {
    X: { name: 'X', effects: ['Y'] },
    Y: { name: 'Y', effects: ['X'] },
  };

  assert.deepEqual(normalize(getDepChains(cyclic.X, cyclic)), ['Y > X']);
});

test('顶层依赖没有 effects，链条只有自身', () => {
  const graph = { T: { name: 'T', effects: [] } };
  assert.deepEqual(getDepChains(graph.T, graph), [['T']]);
});
