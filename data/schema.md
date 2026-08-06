# Data Schema

所有 CSV 由 `scripts/csv-utils.mjs` 中的字段常量控制。新增字段时必须同步更新迁移、校验、生成和前端读取逻辑。

## cases.csv 与 candidate_cases.csv

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定编号，例如 `case-001` |
| `title_original` | 原始标题，保留英文或繁体 |
| `title_cn` | 简体中文标题 |
| `category` | 一级栏目：AI Literacy、AI+STEM、AI+Humanities、AI+Social Sciences、AI for Teaching & Assessment |
| `subcategory` | 细分方向，例如 Math、Science、Coding / CS、Language、Arts & Design、Business / Economics |
| `subject` | 具体学科或主题 |
| `education_level` | 适用学段 |
| `language` | 来源主要语言 |
| `region` | 案例地区 |
| `ai_tool_or_method` | AI 工具、模型或教学方法 |
| `summary_cn` | 简体中文摘要 |
| `teaching_goal_cn` | 可观察的教学目标 |
| `implementation_cn` | 课堂或课程实施过程 |
| `outcomes_cn` | 来源可支持的学习成果；没有证据时必须明确说明 |
| `limitations_cn` | 适用条件、问题和风险 |
| `workflow_cn` | 可复制的课堂技能或工作流 |
| `source_type` | 课程资源、研究论文、学校案例、教师实践、媒体报道、视频案例等 |
| `credibility` | 官方/学校、论文/研究、教师实践、媒体报道 |
| `source_url` | 原始来源链接 |
| `canonical_url` | 删除追踪参数并规范化后的来源链接 |
| `published_date` | 来源发布日期，可为 YYYY、YYYY-MM 或 YYYY-MM-DD |
| `accessed_date` | 首次收集或人工访问日期 |
| `last_verified_date` | 自动程序真正成功访问原链接的最近日期 |
| `link_status` | unverified、ok、redirected、blocked、broken、error |
| `http_status` | 最近一次检测的 HTTP 状态码 |
| `redirect_url` | 成功跳转后的最终地址 |
| `quality_score` | 0-100 的资料完整度评分 |
| `quality_label` | 高质量、资料完整、基本可用、资料不完整 |

## resources.csv

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定编号，例如 `resource-001` |
| `title_original` | 原始标题 |
| `title_cn` | 简体中文标题 |
| `resource_type` | 课程/教材、教师指南、政策框架、课堂工具包、学生课程、资源目录、研究报告 |
| `category` | 五个一级栏目之一 |
| `subject` | 学科或主题 |
| `education_level` | 适用学段 |
| `audience` | 教师、学生、学校领导、课程设计者等 |
| `language` | 来源主要语言 |
| `region` | 地区或组织来源 |
| `publisher` | 发布机构 |
| `summary_cn` | 简体中文简介 |
| `use_case_cn` | 可直接借鉴的使用方式 |
| `source_url` | 原始来源链接 |
| `canonical_url` | 规范化来源链接 |
| `published_date` | 来源发布日期 |
| `accessed_date` | 首次收集或人工访问日期 |
| `last_verified_date` | 成功核验原链接的最近日期 |
| `link_status` | unverified、ok、redirected、blocked、broken、error |
| `http_status` | 最近一次检测的 HTTP 状态码 |
| `redirect_url` | 最终重定向地址 |
| `access_type` | 免费、需注册、付费/订阅、未知 |
| `quality_score` | 0-100 的资料完整度评分 |
| `quality_label` | 高质量、资料完整、基本可用、资料不完整 |

## prompts.csv

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定编号，例如 `prompt-001` |
| `title_cn` | 简体中文标题 |
| `prompt_type` | 备课设计、教材生成、练习与作业、评价反馈、差异化支持、项目学习、课堂活动、家校沟通、学生支持 |
| `skill_domain` | 技能领域，例如课程设计与评价、包容性设计、评价与反馈 |
| `category` | 五个一级栏目之一 |
| `subject` | 学科或主题 |
| `education_level` | 适用学段 |
| `audience` | 目标使用者 |
| `output_format` | 预期生成物 |
| `ai_tool_or_method` | 适用工具或方法 |
| `prompt_cn` | 可复制 Prompt 正文 |
| `use_case_cn` | 使用场景 |
| `required_inputs` | 使用前必须替换或提供的变量 |
| `optional_inputs` | 可选情境变量 |
| `output_schema` | 期望输出的结构和组成 |
| `evidence_strength` | 强、中等、初步、实践框架、未评级 |
| `evidence_sources` | 研究、框架或实践参考来源 |
| `limitations_cn` | 使用限制和教师核查责任 |
| `next_steps` | 建议连接的下一步 Prompt 或教学动作 |
| `tested_models` | 已测试或预期适用的模型说明 |
| `verification_checklist` | 事实、目标、公平性和教师审阅检查项 |
| `privacy_note` | 个人资料与学生隐私提醒 |
| `version` | Prompt 技能版本 |
| `source_title` | 参考来源标题 |
| `source_url` | 参考来源链接 |
| `canonical_url` | 规范化来源链接 |
| `accessed_date` | 首次收集或人工访问日期 |
| `last_verified_date` | 成功核验原链接的最近日期 |
| `link_status` | unverified、ok、redirected、blocked、broken、error |
| `http_status` | 最近一次检测的 HTTP 状态码 |
| `redirect_url` | 最终重定向地址 |
| `quality_score` | 0-100 的资料完整度评分 |
| `quality_label` | 高质量、资料完整、基本可用、资料不完整 |

## learning_paths.json

每条学习路径包含：

| 字段 | 说明 |
| --- | --- |
| `id` | URL 使用的稳定路径编号 |
| `title_cn` | 简体中文标题 |
| `title_en` | 英文标题 |
| `duration` | 建议时长 |
| `audience` | 学段或目标教师群体 |
| `description_cn` | 路径简介 |
| `outcome_cn` | 完成路径后的预期产出 |
| `steps` | 至少两个按顺序执行的步骤 |

每个 `steps` 项目必须包含 `type`、`id` 和 `action_cn`。`type` 只能是 `case`、`resource` 或 `prompt`，`id` 必须引用对应 CSV 中真实存在的记录。

## 固定规则

- 日期只允许 YYYY、YYYY-MM 或 YYYY-MM-DD。
- 每个文件内 `id` 不得重复。
- 标题指纹和规范 URL 同时相同的记录视为重复。
- `last_verified_date` 只能由真实链接核验成功更新。
- 质量分只表示资料完整度，不得写成教学成效结论。
- 没有来源证据时，不能补写确定性的学习成果。
