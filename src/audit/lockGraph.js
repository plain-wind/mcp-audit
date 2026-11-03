import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const LOCK_FILES = ['npm-shrinkwrap.json', 'package-lock.json'];
// 单个漏洞包最多保留的路径数，避免热门包被大量依赖时链数量爆炸
const MAX_CHAINS = 50;

function nameFromPath(path) {
  const marker = 'node_modules/';
  const index = path.lastIndexOf(marker);
  return index === -1 ? path : path.slice(index + marker.length);
}

/**
 * 生成某个包在 node_modules 中的依赖，可能被安装到哪些路径（npm 的向上查找规则）。
 */
function* candidatePaths(fromPath, dependencyName) {
  let current = fromPath;
  while (current) {
    yield `${current}/node_modules/${dependencyName}`;
    const index = current.lastIndexOf('/node_modules/');
    if (index === -1) break;
    current = current.slice(0, index);
  }
  yield `node_modules/${dependencyName}`;
}

function dependencyNames(entry, { includeDev } = {}) {
  return new Set([
    ...Object.keys(entry.dependencies || {}),
    ...Object.keys(entry.optionalDependencies || {}),
    ...(includeDev ? Object.keys(entry.devDependencies || {}) : []),
  ]);
}

/**
 * 用 lockfile 的 packages 字段构建依赖图。
 *
 * 相比 npm audit 报告里的 effects（按包名聚合，无法区分同名不同版本），
 * lockfile 里的安装路径是唯一的，因此能给出准确的依赖链。
 *
 * @param {Object} packages package-lock.json 的 packages 字段
 * @returns {{chainsTo: (paths: string[]) => string[][]}|null}
 */
export function buildLockGraph(packages) {
  if (!packages || typeof packages !== 'object') return null;

  const entries = new Map();
  for (const [path, info] of Object.entries(packages)) {
    if (!path || !info) continue;
    entries.set(path, {
      path,
      name: info.name || nameFromPath(path),
      dependencies: info.dependencies || {},
      optionalDependencies: info.optionalDependencies || {},
    });
  }
  if (entries.size === 0) return null;

  // childPath -> Set(parentPath)，"" 表示工程根
  const parents = new Map();
  const addEdge = (parent, child) => {
    if (!parents.has(child)) parents.set(child, new Set());
    parents.get(child).add(parent);
  };
  const resolve = (fromPath, dependencyName) => {
    for (const candidate of candidatePaths(fromPath, dependencyName)) {
      if (entries.has(candidate)) return candidate;
    }
    return null;
  };

  for (const entry of entries.values()) {
    for (const dependency of dependencyNames(entry)) {
      const child = resolve(entry.path, dependency);
      if (child && child !== entry.path) addEdge(entry.path, child);
    }
  }

  const root = packages[''] || {};
  for (const dependency of dependencyNames(root, { includeDev: true })) {
    const child = resolve('', dependency);
    if (child) addEdge('', child);
  }

  function chainsTo(paths = []) {
    const chains = [];
    const seen = new Set();

    for (const start of paths) {
      if (!entries.has(start)) continue;

      const walk = (currentPath, trail) => {
        if (trail.includes(currentPath)) return;
        const nextTrail = [...trail, currentPath];
        const currentParents = parents.get(currentPath);

        if (!currentParents || currentParents.size === 0) return;

        for (const parentPath of currentParents) {
          if (parentPath === '') {
            // 去掉工程根自身，保留 [顶层依赖, ..., 漏洞包] 的形式
            const names = [...nextTrail].reverse().map((path) => entries.get(path).name);
            const key = names.join(' > ');
            if (!seen.has(key) && chains.length < MAX_CHAINS) {
              seen.add(key);
              chains.push(names);
            }
          } else {
            walk(parentPath, nextTrail);
          }
        }
      };

      walk(start, []);
    }

    return chains.sort(
      (a, b) => a.length - b.length || a.join(' > ').localeCompare(b.join(' > '))
    );
  }

  return { chainsTo };
}

/**
 * 读取工作目录里的 lockfile 并构建依赖图；没有可用 lockfile 时返回 null。
 */
export async function readLockGraph(workDir) {
  for (const name of LOCK_FILES) {
    let raw;
    try {
      raw = await readFile(join(workDir, name), 'utf8');
    } catch {
      continue;
    }

    let lock;
    try {
      lock = JSON.parse(raw);
    } catch {
      continue;
    }

    const graph = buildLockGraph(lock.packages);
    if (graph) return graph;
  }
  return null;
}
