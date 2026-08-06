import { readFile, writeFile } from 'node:fs/promises';
import { PROMPT_FIELDS, parseCsv, toCsv } from './csv-utils.mjs';
import { enrichPromptRecord } from './data-quality.mjs';

const PROMPTS_PATH = 'data/prompts.csv';
const GENERATED_ID_PREFIX = 'prompt-skill-';
const SOURCE_TITLE = 'AIED Case Hub 原创学科教学技能包 v1';
const SOURCE_URL = 'https://github.com/Jojo-Edtech/aiedcase';
const ACCESSED_DATE = '2026-08-06';

const subjects = [
  { slug: 'math', subject: 'Math', label: '数学', category: 'AI+STEM', level: '小学至高中', focus: '概念理解、表征转换、推理过程和错因诊断', artifact: '解题过程、表征图和订正说明' },
  { slug: 'science', subject: 'Science', label: '科学', category: 'AI+STEM', level: '小学至高中', focus: '科学解释、变量控制、证据判断和模型限制', artifact: '实验方案、数据记录和证据解释' },
  { slug: 'coding', subject: 'Coding / CS', label: '编程与计算机科学', category: 'AI+STEM', level: '小学至大学', focus: '算法思维、代码阅读、调试证据和可解释性', artifact: '可运行代码、测试记录和调试说明' },
  { slug: 'stem', subject: 'Integrated STEM', label: '跨学科 STEM', category: 'AI+STEM', level: '小学至高中', focus: '真实问题、工程设计、原型迭代和证据取舍', artifact: '设计原型、测试数据和迭代日志' },
  { slug: 'chinese', subject: '中文', label: '中文', category: 'AI+Humanities', level: '小学至高中', focus: '阅读证据、语言表达、修订过程和作者选择', artifact: '带批注文本、修订稿和写作说明' },
  { slug: 'english', subject: 'Language', label: '英语与语言学习', category: 'AI+Humanities', level: '小学至大学', focus: '听说读写、语境运用、语言反馈和学习者自主性', artifact: '语言作品、反馈记录和自我修订稿' },
  { slug: 'history', subject: 'History', label: '历史', category: 'AI+Humanities', level: '初中至大学', focus: '史料来源、语境解释、多重视角和论证', artifact: '史料分析表、证据链和历史论证' },
  { slug: 'geography', subject: 'Geography', label: '地理', category: 'AI+Social Sciences', level: '初中至高中', focus: '空间关系、数据解释、人地互动和尺度判断', artifact: '地图或数据分析、解释和限制说明' },
  { slug: 'civics', subject: 'Social Studies / Civics', label: '社会研究与公民教育', category: 'AI+Social Sciences', level: '小学至高中', focus: '公共议题、多元立场、证据评估和公民行动', artifact: '立场证据表、政策建议或公民行动方案' },
  { slug: 'business', subject: 'Business / Economics', label: '商业与经济', category: 'AI+Social Sciences', level: '高中至大学', focus: '市场假设、经济权衡、数据分析和利益相关者影响', artifact: '商业分析、情境决策和风险说明' },
  { slug: 'arts', subject: 'Arts & Design', label: '视觉艺术与设计', category: 'AI+Humanities', level: '小学至大学', focus: '创意意图、视觉语言、迭代选择和作者责任', artifact: '创意作品、版本记录和设计说明' },
  { slug: 'performing-arts', subject: 'Music / Drama', label: '音乐与戏剧', category: 'AI+Humanities', level: '小学至大学', focus: '表演意图、结构、排练反馈和协作创作', artifact: '表演方案、排练记录和创作反思' },
  { slug: 'ai-literacy', subject: 'AI素养', label: 'AI 素养', category: 'AI Literacy', level: '小学至大学', focus: '能力边界、事实核查、偏见、透明使用和人工判断', artifact: 'AI 输出审查表、修改记录和使用声明' },
  { slug: 'media-literacy', subject: '媒体素养', label: '媒体与信息素养', category: 'AI Literacy', level: '小学至大学', focus: '来源核查、合成内容识别、传播意图和可信度判断', artifact: '来源核查表、证据标注和媒体判断说明' },
  { slug: 'inclusive-learning', subject: '特殊教育/学习支持', label: '融合教育与学习支持', category: 'AI for Teaching & Assessment', level: '小学至大学', focus: '可访问性、学习差异、优势取向和去标签化支持', artifact: '可访问学习材料、支持方案和教师观察记录' },
];

const skills = [
  {
    slug: 'goal-alignment',
    title: '可观察目标与活动对齐',
    promptType: '备课设计',
    outputFormat: '目标-活动-评价对齐表',
    instruction: '把宽泛课程目标改写成可观察表现，并检查每项活动和评价证据是否真正对齐。',
    outputSchema: '目标拆解；学生可观察表现；活动步骤；评价证据；不对齐风险；教师调整建议',
    limitation: '不要把易测量等同于重要学习，也不要删除课程中的创造、价值判断或复杂理解。',
    next: '使用“形成性提问序列”技能，为每个目标设计课堂检查点。',
  },
  {
    slug: 'misconception-diagnosis',
    title: '常见误解诊断活动',
    promptType: '课堂活动',
    outputFormat: '误解诊断任务',
    instruction: '围绕核心概念设计能暴露学生推理的诊断题，不只判断对错，还要要求解释证据。',
    outputSchema: '核心概念；3-5 个常见误解；诊断题；学生解释提示；教师追问；判断依据',
    limitation: '常见误解只是待检验假设，不能据此给学生贴标签；必须结合真实作答再判断。',
    next: '把真实学生答案匿名输入“反馈与修订循环”技能，生成可行动反馈。',
  },
  {
    slug: 'worked-example',
    title: '带自我解释的示例教材',
    promptType: '教材生成',
    outputFormat: '示例与自我解释学习单',
    instruction: '生成一个分步骤示例，并在关键决策点插入预测、解释和比较问题，避免学生被动照抄。',
    outputSchema: '问题情境；步骤化示例；关键决策点；自我解释问题；相似迁移题；答案核查',
    limitation: '示例步骤可能隐含未经说明的假设，教师应核对学科准确性、难度和替代方法。',
    next: '使用“分层认知支架”技能生成逐步撤除帮助的三个版本。',
  },
  {
    slug: 'inquiry-project',
    title: '证据驱动探究项目',
    promptType: '项目学习',
    outputFormat: '探究项目任务书',
    instruction: '把主题转成真实问题，要求学生提出假设、收集证据、比较解释并公开说明 AI 的参与方式。',
    outputSchema: '驱动问题；学习目标；里程碑；证据要求；团队角色；AI 使用边界；最终产出；评价标准',
    limitation: '项目规模必须与课堂时间、设备和学生经验匹配，不能让工具操作取代学科探究。',
    next: '使用“评价量规与证据锚点”技能建立项目评价标准和示例锚点。',
  },
  {
    slug: 'formative-questioning',
    title: '形成性提问序列',
    promptType: '课堂活动',
    outputFormat: '课堂提问与检查点脚本',
    instruction: '按激活已有知识、暴露推理、比较证据、迁移应用的顺序设计提问，并给出教师跟进动作。',
    outputSchema: '提问阶段；问题；预期思考；可能回答；教师追问；快速收集证据方式；调整分支',
    limitation: 'AI 预测的学生回答不代表本班真实反应，教师必须根据现场证据灵活改变追问。',
    next: '把课堂记录带入“反馈与修订循环”技能，形成下一课调整建议。',
  },
  {
    slug: 'differentiated-scaffolds',
    title: '分层认知支架',
    promptType: '差异化支持',
    outputFormat: '三层支架学习材料',
    instruction: '在保持同一高价值目标的前提下，设计语言、表征、步骤和挑战程度不同的支架，并说明撤除条件。',
    outputSchema: '共同目标；进入任务；基础支架；标准支架；延伸挑战；支架撤除信号；可访问性检查',
    limitation: '分层不等于固定能力分组，不得用缺陷标签描述学生；所有学生都应有进入高阶任务的机会。',
    next: '使用“学生反思与学习策略”技能帮助学生选择并评估所需支架。',
  },
  {
    slug: 'rubric-evidence',
    title: '评价量规与证据锚点',
    promptType: '评价反馈',
    outputFormat: '分析式评价量规',
    instruction: '从学习目标和真实学生产出出发，生成可观察、互不重叠的标准，并为每档表现提供证据描述。',
    outputSchema: '评价目标；3-5 个维度；表现等级；可观察证据；边界案例；教师校准问题；学生自评版本',
    limitation: 'AI 生成量规不能直接决定成绩；教师需用真实作品校准语言、权重、公平性和学段适切性。',
    next: '抽取三份匿名作品试评分，再使用“反馈与修订循环”技能检查量规能否支持改进。',
  },
  {
    slug: 'feedback-revision',
    title: '反馈与修订循环',
    promptType: '评价反馈',
    outputFormat: '可行动反馈与修订计划',
    instruction: '根据目标和学生作品生成少量高优先级反馈，每条反馈都连接证据、下一步行动和学生自检。',
    outputSchema: '作品证据；已达成之处；优先改进点；具体行动；示例但非代写答案；自检问题；复核安排',
    limitation: '不得输入可识别学生资料；AI 反馈必须由教师核对，不能代替成绩判断、特殊需要判断或关系性沟通。',
    next: '学生修订后比较前后版本，并使用“学生反思与学习策略”技能记录变化原因。',
  },
  {
    slug: 'metacognitive-reflection',
    title: '学生反思与学习策略',
    promptType: '学生支持',
    outputFormat: '元认知反思单',
    instruction: '设计短而具体的反思提示，帮助学生说明目标、策略、证据、困难、AI 使用和下一次调整。',
    outputSchema: '目标回顾；采用策略；有效证据；困难点；AI 帮助与限制；下一步计划；教师回应栏',
    limitation: '反思不能被当作人格或能力测量；允许学生用不同表达方式回答，并避免强迫披露私人经历。',
    next: '教师汇总匿名模式，再用“可观察目标与活动对齐”技能调整下一轮教学。',
  },
  {
    slug: 'transparent-ai-use',
    title: '透明 AI 使用与核查',
    promptType: '课堂活动',
    outputFormat: 'AI 使用声明与核查清单',
    instruction: '把学习任务改成要求学生保存提示词、标记 AI 贡献、核查关键事实、解释人工修改和承担最终责任。',
    outputSchema: '允许用途；禁止用途；提示词记录；事实核查表；版本差异；人工判断说明；引用与披露格式',
    limitation: '必须符合学校政策、年龄要求和工具条款；不能上传个人资料、受版权保护材料或保密内容。',
    next: '使用“评价量规与证据锚点”技能，把过程证据和透明披露纳入评价标准。',
  },
];

const existing = parseCsv(await readFile(PROMPTS_PATH, 'utf8'));
const preserved = existing.filter((record) => !String(record.id || '').startsWith(GENERATED_ID_PREFIX));
const generated = subjects.flatMap((subject) => skills.map((skill) => buildSkill(subject, skill)));

await writeFile(PROMPTS_PATH, toCsv([...preserved, ...generated], PROMPT_FIELDS));
console.log(`Preserved ${preserved.length} prompt(s) and generated ${generated.length}; total ${preserved.length + generated.length}.`);

function buildSkill(subject, skill) {
  const prompt = [
    `你是一名熟悉${subject.label}教学、学习科学与负责任 AI 使用的课程设计伙伴。`,
    '',
    `任务：${skill.instruction}`,
    '',
    '请使用以下输入：',
    '- 学段：[学段]',
    '- 单元或主题：[主题]',
    '- 学习目标：[学习目标]',
    '- 课堂时间：[课堂时间]',
    '- 学生已有基础：[学生已有基础]',
    '- 可用资料与设备：[可用资料与设备]',
    '- 需要支持的学习差异：[学习差异，可留空]',
    '',
    `学科重点：${subject.focus}。`,
    `学生应留下的可检查产出：${subject.artifact}。`,
    '',
    '输出要求：',
    `1. 按以下结构输出：${skill.outputSchema}。`,
    '2. 明确区分教师动作、学生动作、AI 可做与不可做的事情。',
    '3. 每个关键判断都给出教师可观察或可收集的学习证据。',
    '4. 不虚构课程标准、事实、引用、学生数据或学习成效；不确定时标注“需要教师核查”。',
    '5. 内容应适合给定学段，并提供一个无需付费工具的替代方案。',
    '6. 结尾附上“教师使用前检查”与“学生 AI 使用说明”。',
  ].join('\n');

  return enrichPromptRecord({
    id: `${GENERATED_ID_PREFIX}${subject.slug}-${skill.slug}`,
    title_cn: `${subject.label}：${skill.title}`,
    prompt_type: skill.promptType,
    skill_domain: '',
    category: subject.category,
    subject: subject.subject,
    education_level: subject.level,
    audience: '教师、课程设计者',
    output_format: skill.outputFormat,
    ai_tool_or_method: '通用生成式 AI',
    prompt_cn: prompt,
    use_case_cn: `用于${subject.label}备课中的${skill.title}，强调${subject.focus}，并保留教师最终判断。`,
    required_inputs: '学段；主题；学习目标；课堂时间；学生已有基础；可用资料与设备',
    optional_inputs: '学习差异；本校 AI 政策；课程标准；现有教材；真实学生匿名作品',
    output_schema: skill.outputSchema,
    evidence_strength: '实践框架',
    evidence_sources: 'AIED Case Hub 原创教学技能结构；使用时需结合课程文件、真实学生证据和本校政策核查',
    limitations_cn: skill.limitation,
    next_steps: skill.next,
    tested_models: '通用生成式 AI；尚未对所有模型逐一验证，长输出建议分步骤生成',
    verification_checklist: `学科事实和引用可核实；符合${subject.label}学习目标与学段；要求学生主动思考；产出包含可观察证据；评价语言清楚公平；已删除个人资料；教师完成最终审阅`,
    privacy_note: '不要输入学生真实姓名、联系方式、健康资料、个别教育计划、成绩明细或其他可识别资料；使用真实作品前先匿名化。',
    version: '1.0',
    source_title: SOURCE_TITLE,
    source_url: SOURCE_URL,
    canonical_url: SOURCE_URL,
    accessed_date: ACCESSED_DATE,
    last_verified_date: '',
    link_status: 'unverified',
    http_status: '',
    redirect_url: '',
    quality_score: '0',
    quality_label: '资料不完整',
  });
}
