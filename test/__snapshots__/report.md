# `demo-site` 安全审计报告

本次审计覆盖工程自身、全部直接依赖与间接依赖。

- 受影响的依赖包：**3** 个
- 漏洞条目：**3** 条
- 依赖树来源：工程自带的 lockfile

| 等级 | 依赖包 | 漏洞条目 |
| --- | ---: | ---: |
| 严重 | 1 | 1 |
| 高危 | 1 | 1 |
| 中危 | 1 | 1 |
| 低危 | 0 | 0 |

## 严重漏洞（1 个依赖包）

### `lodash`（直接依赖）

- 漏洞等级：**严重**
- 修复建议：升级到 lodash@4.17.21

**漏洞描述**

- Prototype Pollution in lodash
  - 漏洞编号：`1065`
  - 详细说明：<https://github.com/advisories/GHSA-xxxx>
  - 漏洞等级：严重
  - 受影响的版本：`<4.17.21`

**依赖关系**

- `demo-site` / `lodash`

**漏洞包所在目录**

- `/demo/project/node_modules/lodash`

## 高危漏洞（1 个依赖包）

### `demo-site`

- 漏洞等级：**高危**
- 修复建议：暂无可用修复

**漏洞描述**

- Demo project own advisory
  - 漏洞编号：`9999`
  - 详细说明：<https://github.com/advisories/GHSA-yyyy>
  - 漏洞等级：高危
  - 受影响的版本：`<2.0.0`

**依赖关系**

- 当前工程

**漏洞包所在目录**

- `/demo/project`

## 中危漏洞（1 个依赖包）

### `minimatch`

- 漏洞等级：**中危**
- 修复建议：升级到 minimatch@3.1.2（跨大版本，需评估兼容性）

**漏洞描述**

- minimatch ReDoS ‹script›alert(1)‹/script›
  - 漏洞编号：`7777`
  - 详细说明：<https://github.com/advisories/GHSA-zzzz>
  - 漏洞等级：中危
  - 受影响的版本：`<3.0.5`

**依赖关系**

- `demo-site` / `ejs` / `jake` / `minimatch`

**漏洞包所在目录**

- `/demo/project/node_modules/ejs/node_modules/minimatch`

## 审计说明

- 无法获取工程自身发布版本的漏洞信息：request timeout
