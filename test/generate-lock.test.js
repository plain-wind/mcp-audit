import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateLock } from '../src/generateLock/index.js';

const packageJson = { name: 'demo-site', version: '1.0.0', dependencies: {} };

async function createDir() {
  return mkdtemp(join(tmpdir(), 'mcp-audit-lock-'));
}

test('本地工程已有 package-lock.json 时直接复用，不重新解析', async () => {
  const projectDir = await createDir();
  const workDir = await createDir();
  const lockContent = JSON.stringify({
    name: 'demo-site',
    lockfileVersion: 3,
    packages: {},
    _marker: 'project-lock',
  });
  await writeFile(join(projectDir, 'package.json'), JSON.stringify(packageJson));
  await writeFile(join(projectDir, 'package-lock.json'), lockContent);

  try {
    const result = await generateLock(workDir, packageJson, { projectRoot: projectDir });

    assert.equal(result.source, 'project');
    assert.equal(
      await readFile(join(workDir, 'package-lock.json'), 'utf8'),
      lockContent,
      '工作目录中的 lock 应与项目 lock 完全一致'
    );
    assert.deepEqual((await readdir(workDir)).sort(), ['package-lock.json', 'package.json']);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
    await rm(workDir, { recursive: true, force: true });
  }
});

test('npm-shrinkwrap.json 优先于 package-lock.json', async () => {
  const projectDir = await createDir();
  const workDir = await createDir();
  await writeFile(join(projectDir, 'package.json'), JSON.stringify(packageJson));
  await writeFile(
    join(projectDir, 'package-lock.json'),
    JSON.stringify({ _marker: 'package-lock' })
  );
  await writeFile(
    join(projectDir, 'npm-shrinkwrap.json'),
    JSON.stringify({ _marker: 'shrinkwrap' })
  );

  try {
    const result = await generateLock(workDir, packageJson, { projectRoot: projectDir });

    assert.equal(result.source, 'project');
    assert.equal(result.lockFile, join(projectDir, 'npm-shrinkwrap.json'));
  } finally {
    await rm(projectDir, { recursive: true, force: true });
    await rm(workDir, { recursive: true, force: true });
  }
});

test('工程没有 lockfile 时按 package.json 生成', async () => {
  const projectDir = await createDir();
  const workDir = await createDir();
  await writeFile(join(projectDir, 'package.json'), JSON.stringify(packageJson));

  try {
    const result = await generateLock(workDir, packageJson, { projectRoot: projectDir });

    assert.equal(result.source, 'generated');
    assert.equal(result.lockFile, null);
    assert.deepEqual((await readdir(workDir)).sort(), ['package-lock.json', 'package.json']);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
    await rm(workDir, { recursive: true, force: true });
  }
});

test('远程工程没有本地 lockfile，按 package.json 生成', async () => {
  const workDir = await createDir();

  try {
    const result = await generateLock(workDir, packageJson);

    assert.equal(result.source, 'generated');
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
