# `demo-site`审计结果


您所审计的工程总共有 **3** 个风险漏洞。

其中：

- **严重漏洞**：共计 **1** 个
- **高危漏洞**：共计 **1** 个
- **中危漏洞**：共计 **1** 个
- **低危漏洞**：共计 **0** 个

> 说明：
>
> - **严重**漏洞被认为是极其严重的，应该立即修复。
> - **高危**漏洞被认为是严重的，应该尽快修复。
> - **中危**漏洞被认为是中等严重的，可以选择在时间允许时修复。
> - **低危**漏洞被认为是轻微的，可以根据自行需要进行修复。

下面是漏洞的详细信息


## 严重漏洞

共计 **1** 个


### `lodash`

**漏洞描述**：

- Prototype Pollution in lodash
  - npm漏洞编号：`1065`
  - 漏洞详细说明：https://github.com/advisories/GHSA-xxxx
  - 漏洞等级：严重
  - 受影响的版本：`<4.17.21`


**依赖关系**：



- `demo-site` / `lodash`

  
  

**漏洞包所在目录**：

- `node_modules/lodash`





## 高危漏洞

共计 **1** 个


### `demo-site`

**漏洞描述**：

- Demo project own advisory
  - npm漏洞编号：`9999`
  - 漏洞详细说明：https://github.com/advisories/GHSA-yyyy
  - 漏洞等级：高危
  - 受影响的版本：`<2.0.0`


**依赖关系**：


当前工程



**漏洞包所在目录**：

- `.`





## 中危漏洞

共计 **1** 个


### `minimatch`

**漏洞描述**：

- minimatch ReDoS
  - npm漏洞编号：`7777`
  - 漏洞详细说明：https://github.com/advisories/GHSA-zzzz
  - 漏洞等级：中危
  - 受影响的版本：`<3.0.5`


**依赖关系**：



- `demo-site` / `ejs` / `jake` / `minimatch`

  
  

**漏洞包所在目录**：

- `node_modules/ejs/node_modules/minimatch`







