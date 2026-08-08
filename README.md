# AIED Case Hub

AIED Case Hub 是一个面向教师的 AI 教育资料库，主站部署于 GitHub Pages，并同步到阿里云 ECS 大陆镜像。网站把教学案例、教材资源、Prompt 教学技能、教师工具和专题学习路径放在同一个入口中。

GitHub Pages：<https://jojo-edtech.github.io/aiedcase/>

阿里云 HTTPS 镜像：<https://47.106.124.32/aiedcase/>

## 当前内容

- 300+ 个教学案例，覆盖 AI Literacy、AI+STEM、AI+Humanities、AI+Social Sciences、AI for Teaching & Assessment；准确数量由首页实时读取 CSV。
- 40 个全球课程、教材、框架、工具包和教师指南。
- 270 个结构化 Prompt 教学技能，覆盖备课、教材、练习、评价、差异化支持、项目学习和课堂活动。
- 4 条专题学习路径，把案例、资源和 Prompt 组合成可直接采用的备课路线。
- 简体中文、繁体中文和英文界面。英文或繁体来源保留原始标题，资料摘要以简体中文为主。

所有数量都从 CSV 数据实时读取，不写死在页面中。

## 核心功能

- 首页是教师工作台：教师先选择主学科、融合学科、学段、课时、AI 角色和课程主题，再生成可复制的跨学科课程框架。
- 工作台图表直接读取案例 CSV，显示案例栏目分布、学段覆盖和最近核验的香港案例，不使用演示数据。
- 搜索、栏目、学科、学段、地区、来源、语言、AI 方法、资料质量和链接状态筛选。
- 每条内容显示质量分级、链接核验状态、来源和独立详情链接。
- 案例详情包含教学目标、课堂流程、学习成效证据、限制条件和可复制工作流。
- Prompt 采用“教学技能”结构，包含必填变量、可选变量、输出结构、证据等级、限制、后续步骤、核查清单和隐私提醒。
- 每条案例、资源和 Prompt 都有独立静态页，可单独分享、生成页面预览并被搜索引擎索引。
- 本地收藏、只看收藏、复制内容和 Markdown 备课包导出。收藏仅保存在浏览器 `localStorage`。
- 教师工具分为两类：收藏备课包和课堂 AI 守则在浏览器本地运行；AI 教学材料生成器经阿里云安全代理调用 ModelScope，并提供断网时的本地 Prompt 备用方案。
- 站内 AI 助手直接检索案例、教材与 Prompt，回答附带原始来源；不再嵌入 ModelScope iframe，也不要求读者登录 ModelScope。
- 手机端使用固定底部导航、横向概览卡片和可收起筛选/课程结果；核心备课流程在 320px 宽度仍可使用。

独立详情页示例：

```text
https://jojo-edtech.github.io/aiedcase/cases/case-001.html
https://jojo-edtech.github.io/aiedcase/resources/resource-001.html
https://jojo-edtech.github.io/aiedcase/prompts/prompt-001.html
https://jojo-edtech.github.io/aiedcase/paths/ai-literacy-30min.html
```

## 本地运行

```bash
python3 -m http.server 4173
```

浏览器打开 `http://localhost:4173`。

常用命令：

```bash
npm run migrate:data       # 迁移字段、规范 URL、计算质量分和去重
npm run expand:prompts     # 重建 150 条原创学科教学技能，并保留原有 Prompt
npm run validate:data      # 校验 CSV、固定标签和学习路径引用
npm run test:quality       # 测试 URL 规范化、质量评分和 Prompt 技能补全
npm run generate:pages     # 生成独立详情页和 sitemap.xml
npm run build:static       # 生成可部署到 OSS 的 dist/
npm run test:ux            # 500 轮桌面/平板/手机用户交互测试
npm run check:links        # 实际访问来源链接并记录核验结果
```

## 数据结构

数据接口的完整字段、固定标签和解释见 [`data/schema.md`](data/schema.md)。主要文件为：

- `data/cases.csv`：正式教学案例。
- `data/candidate_cases.csv`：可选质量门槛启用时的暂存池。
- `data/resources.csv`：全球资源与教材。
- `data/prompts.csv`：结构化 Prompt 教学技能。
- `data/learning_paths.json`：专题学习路径。
- `data/reports/`：去重和链接核验报告。

### 质量评分

质量评分是资料完整度提示，不代表教学效果的最终判断。固定标签为：

| 分数 | 标签 |
| --- | --- |
| 85-100 | 高质量 |
| 70-84 | 资料完整 |
| 55-69 | 基本可用 |
| 0-54 | 资料不完整 |

案例评分考虑教学目标、实施过程、工作流、学习成效证据、限制说明和来源可信度。资源评分考虑简介、使用方式、出版机构、访问方式和来源完整性。Prompt 评分考虑变量、输出结构、证据来源、限制、核查清单和隐私提醒。

自动补全不会虚构学习效果。如果原来源没有报告成果，`outcomes_cn` 会明确写明“来源页面未提供可核实的学习成效数据”。

### 链接核验

`accessed_date` 表示资料最初收集或人工访问的日期；`last_verified_date` 只会在自动程序真正成功访问原链接时更新。

链接状态固定为：

- `unverified`：尚未实际检测。
- `ok`：成功访问原链接。
- `redirected`：成功访问，但跳转到新地址。
- `blocked`：来源站点返回登录、限流、地区限制或反自动化状态，不等同于失效。
- `broken`：明确返回 404 或 410。
- `error`：本次出现网络或服务器错误，之后会重试。

核验报告保存在 `data/reports/link-check-report.json`，包含 HTTP 状态码和最终重定向地址。失败或被拦截不会被伪装成“当天已核验”。

### 去重

数据迁移会先规范来源 URL，删除追踪参数、片段和多余斜线，再使用“规范 URL + 标题指纹”识别重复记录。报告保存在 `data/reports/dedup-report.json`。

## Prompt 教学技能

Prompt 不再只是单段文字。每条记录包括：

- 技能领域和适用任务。
- 必填与可选输入。
- 预期输出结构。
- 证据等级与参考来源。
- 限制条件、下一步 Prompt 和模型适用说明。
- 事实、目标、公平性、个人资料和教师最终审阅核查清单。

该结构参考了 `education-agent-skills` 对输入、输出、证据、限制和技能连接的组织方式，并根据本项目的教师工作流重新设计。没有直接复制第三方 Prompt 内容。

## AI 助手与 RAG

`AI 助手` 和 `教师工具` 中的 AI 生成器通过同一个轻量 RAG API 工作。浏览器只访问 `data/rag-config.json` 中的 `api_base`，ModelScope 令牌保存在阿里云 ECS 的 `/etc/aiedcase-api.env`，不会发送到浏览器或写入 GitHub。后端只监听本机端口，由 Nginx 通过 HTTPS 代理公开，并限制请求大小、来源域名、单 IP 频率和每日生成额度。

RAG 索引直接读取正式的 `cases.csv`、`resources.csv` 和 `prompts.csv`，当前共检索 627 条内容。站内回答会返回命中的资料标题、类型、标签和原链接；资料不足时会明确说明，而不是编造课堂成效。

默认推理模型为 `Qwen/Qwen3-30B-A3B-Instruct-2507`。该模型由 ModelScope 官方模型页标记为支持 API-Inference，采用 30B 总参数、约 3B 激活参数的非思考 MoE 架构，用于这里的短篇中文教学问答比此前 235B 模型更轻量。可通过 Studio 环境变量 `MODELSCOPE_MODEL` 覆盖。

`MODELSCOPE_API_TOKEN`、阿里云 AccessKey、Firecrawl Key 或其他密钥不得写入仓库，只能放在对应平台的 Secrets 或服务器环境文件中。RAG 每日生成上限可通过 `RAG_DAILY_GENERATION_LIMIT` 控制，超出后只返回检索来源，不继续消耗模型额度。教师不应在 AI 助手或生成器中输入学生姓名、联系方式、账号、照片或其他可识别个人资料。

后端代码、systemd、Nginx 和短期 IP 证书续签模板位于 `modelscope_rag/`。完整部署与本地测试方式见 [`modelscope_rag/README.md`](modelscope_rag/README.md)。

## 每日自动更新

仓库配置了两个互不混淆的 GitHub Actions，并使用同一并发锁避免同时写入数据：

1. `Daily AIED Candidate Update` 每天香港时间 06:00 收集新案例。
2. `Daily Source Link Verification` 每天香港时间 06:05 实际检测一批来源链接。

案例收集流程：

1. 读取 `data/source_feeds.json` 中的 RSS、Atom 和 YouTube 信息源。
2. 判断内容是否同时涉及 AI、教育和明确课堂或学习实践。
3. 尝试读取原文正文；配置 `FIRECRAWL_API_KEY` 后优先使用 Firecrawl 增强抓取和搜索。
4. 规范来源 URL、排除已知标题和重复记录。
5. 生成简体中文摘要、课堂结构、可复制工作流和资料质量标签。
6. 默认直接写入 `data/cases.csv`，重新生成独立详情页并推送到 `main`。

默认 `AUTO_PUBLISH_MIN_SCORE=0`，即符合教学实践规则的匹配结果直接发布，同时以质量标签区分完整度。如果希望把低分内容暂存在候选池，可以在 GitHub Repository Variables 中把 `AUTO_PUBLISH_MIN_SCORE` 设为高于 0 的分数。

可选爬虫变量：

```text
ARTICLE_ENRICHMENT_ENABLED=true
ARTICLE_ENRICHMENT_MAX_PER_RUN=18
AUTO_PUBLISH_CASES=true
AUTO_PUBLISH_MIN_SCORE=0
FIRECRAWL_ENABLED=true
FIRECRAWL_PRIMARY=true
FIRECRAWL_SEARCH_ENABLED=true
FIRECRAWL_MAX_PER_RUN=6
FIRECRAWL_API_KEY=仅存放在 GitHub Secrets 的 Key
FIRECRAWL_SEARCH_QUERIES="query1||query2"
```

Firecrawl 返回 403 或 `suspicious IP` 通常是共享云运行器 IP 的风控结果。配置个人 API Key 后会优先使用认证请求；Firecrawl 失败、限流或被拦截时，任务会降级为 RSS 和普通 HTML 抽取，不会因此中断整个更新。

## 静态详情页与 Sitemap

`scripts/generate-detail-pages.mjs` 根据 CSV 自动生成 `cases/`、`resources/`、`prompts/`、`paths/` 和 `sitemap.xml`。每个详情页包含唯一标题、简介、Open Graph 元数据、canonical URL 和 `LearningResource` 结构化数据。

数据变化后必须运行：

```bash
npm run generate:pages
```

每日案例工作流已自动执行该命令。

## GitHub Pages

推荐设置：

- Repository：`Jojo-Edtech/aiedcase`
- Pages source：`main` branch，`/root`
- URL：<https://jojo-edtech.github.io/aiedcase/>

## 阿里云 OSS 镜像

`.github/workflows/deploy-aliyun-oss.yml` 会在启用后把同一份 `dist/` 同步到阿里云 OSS。GitHub Secrets：

```text
ALIYUN_ACCESS_KEY_ID
ALIYUN_ACCESS_KEY_SECRET
ALIYUN_OSS_BUCKET
ALIYUN_OSS_ENDPOINT
ALIYUN_OSS_PREFIX
```

Repository Variable：

```text
ALIYUN_DEPLOY_ENABLED=true
```

AccessKey 只能存放在 GitHub Secrets 或阿里云环境变量，不得写入代码、README 或 CSV。中国内地 Bucket 绑定自定义域名以及使用中国内地 CDN 前，需要按实际服务完成 ICP 备案。

## 阿里云 ECS API

当前 RAG API 独立运行在阿里云 ECS 的 `127.0.0.1:8792`，Nginx 对外提供 `/aiedcase-api/`。公网 IP 使用 Let’s Encrypt 短期 IP 证书，并由 `certbot-ip-renew.timer` 每 12 小时检查续签；域名备案完成后可把 `data/rag-config.json` 的 `api_base` 平滑改为 `https://jojoedtech.cloud/aiedcase-api`。

备案期间的阿里云 HTTPS 镜像为 <https://47.106.124.32/aiedcase/>。该入口与 GitHub Pages 使用同一份静态构建，国内读者无需访问 GitHub 才能加载页面数据。

ECS 环境文件权限必须为 `600`，服务使用无登录权限的 `aiedcase` 系统账户。不要把真实环境文件、令牌值或配套证书私钥复制回仓库。

## 参考与许可证边界

- `awesome-ai-llm4education` 的教学场景分类可作为信息架构参考，但该仓库未声明许可证，本项目不复制其代码或内容。
- `education-agent-skills` 使用 CC BY-SA。本项目只参考其结构化技能思想并自行编写字段与内容；若未来直接改编其具体文本，必须按许可证署名并满足相同方式共享要求。
- MIT 代码可在保留版权和许可证声明后复用。
- CC0 Prompt 可复用；CC BY 和 CC BY-SA 内容需要相应署名，CC BY-SA 还要求相同方式共享。
- 未声明许可证的代码、Prompt 或资料只作结构研究，不直接复制。

前端将 Chart.js 4.5.1 与 Lucide Static 1.30.0 固定在 `vendor/`，避免 GitHub Pages 运行时依赖第三方 CDN。许可证分别见 `vendor/Chart.js-LICENSE.md` 与 `vendor/Lucide-LICENSE.txt`。

本轮界面设计参考了公开项目管理仪表盘的布局语言，并使用项目自身的教师备课流程、内容与数据重新实现；没有复制参考图中的品牌或素材。项目本地安装了 `anti-ui-slop` 与 `web-design-reviewer` 两个 GitHub Skills，用于后续界面审查。

网站展示的外部资料版权归原作者或机构所有。本站仅提供简介、教学工作流和原始链接。
