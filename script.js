const PAGE_SIZE = 24;
const DATA_URLS = {
  cases: "data/cases.csv",
  candidates: "data/candidate_cases.csv",
  resources: "data/resources.csv",
  prompts: "data/prompts.csv",
  paths: "data/learning_paths.json",
};
const RAG_CONFIG_URL = "data/rag-config.json";
const VIEWS = ["cases", "resources", "prompts", "toolkit", "assistant"];

const CATEGORIES = [
  "AI Literacy",
  "AI+STEM",
  "AI+Humanities",
  "AI+Social Sciences",
  "AI for Teaching & Assessment",
];

const SUPPORTED_LANGUAGES = ["zh-Hans", "zh-Hant", "en"];
const LANGUAGE_LABELS = {
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  en: "English",
};
const LANGUAGE_META = {
  "zh-Hans": { htmlLang: "zh-CN", locale: "zh-Hans-CN" },
  "zh-Hant": { htmlLang: "zh-HK", locale: "zh-Hant-HK" },
  en: { htmlLang: "en", locale: "en" },
};

const TEXT = {
  "zh-Hans": {
    documentTitle: "AIED Case Hub | AI教育资料库",
    documentDescription:
      "AIED Case Hub 收集 AI 教育教学案例、全球教材资源和教师可复制 Prompt 模板，支持按学科、学段、语言、地区和类型筛选。",
    skipLink: "跳到内容列表",
    eyebrow: "AI Education Library",
    subtitle: "AI 教育教学案例、教材资源与 Prompt 模板库",
    mainTabsAria: "内容选项卡",
    dataActionsAria: "数据操作",
    languageLabel: "语言",
    languageSelectAria: "选择界面语言",
    dataMenu: "数据与链接",
    expandMenu: "展开",
    collapseMenu: "收起",
    casesCsv: "案例 CSV",
    candidateCsv: "候选 CSV",
    resourcesCsv: "资源 CSV",
    promptsCsv: "Prompt CSV",
    tabCases: "教学案例",
    tabResources: "教材资源",
    tabPrompts: "Prompt 模板",
    tabToolkit: "教师工具",
    toolkitTabStatus: "可复制",
    tabAssistant: "AI 助手",
    assistantStatusTrial: "有限额试用",
    assistantStatusPending: "待连接",
    assistantStatusConnected: "已连接",
    caseDashboardAria: "案例库概览",
    dashboardSummary: "数据概览",
    casesCollected: "已收录案例",
    hkPriorityCases: "香港优先案例",
    topCategories: "一级栏目",
    latestAccessed: "最近访问日期",
    latestVerified: "最近核验日期",
    learningPathsEyebrow: "Curated Pathways",
    learningPathsTitle: "专题学习路径",
    learningPathsCopy: "把案例、教材和 Prompt 组合成可以直接采用的备课路线。",
    viewAllPaths: "查看全部路径",
    openPath: "打开路径",
    pathSteps: "{count} 个步骤",
    candidatePool: "自动候选池",
    candidateCount: "{count} 条待审核候选",
    candidateNote:
      "新匹配案例默认直接发布并显示质量标签；只有启用额外质量门槛时，未达阈值的条目才会暂存在这里。",
    showCandidates: "查看候选",
    hideCandidates: "收起候选",
    candidatePreviewTitle: "最新候选",
    candidateReviewBadge: "待审核",
    autoCollected: "自动收集",
    caseToolbarAria: "案例检索和筛选",
    caseCategoryAria: "案例栏目",
    filterSummary: "搜索与筛选",
    filterExpand: "展开筛选",
    filterCollapse: "收起筛选",
    keyword: "关键词",
    caseSearchPlaceholder: "搜索标题、摘要、工作流、地区、工具或来源",
    subcategory: "细分方向",
    teacherTask: "教师任务",
    favorites: "收藏",
    favoritesOnly: "只看收藏",
    educationLevel: "学段",
    language: "语言",
    region: "地区",
    source: "来源",
    credibility: "可信度",
    aiType: "AI类型",
    quality: "资料质量",
    qualityScore: "质量评分",
    linkStatus: "链接状态",
    httpStatus: "HTTP 状态码",
    resolvedUrl: "重定向地址",
    lastVerified: "最近核验",
    skillDomain: "技能领域",
    evidenceStrength: "证据等级",
    teachingGoal: "教学目标",
    implementation: "实施方式",
    outcomesEvidence: "学习成效证据",
    limitations: "适用条件与限制",
    requiredInputs: "必填输入",
    optionalInputs: "可选输入",
    outputSchema: "输出结构",
    promptLimitations: "使用限制",
    nextSteps: "下一步",
    verificationChecklist: "生成后检查",
    privacyNote: "隐私提醒",
    skillStructure: "查看教学技能结构",
    sort: "排序",
    reset: "重置",
    addFavorite: "收藏",
    removeFavorite: "已收藏",
    details: "详情",
    backToCases: "返回案例列表",
    caseDetailHeading: "案例详情",
    teacherTasks: "教师任务",
    copyDetailLink: "复制详情链接",
    detailLinkCopied: "详情链接已复制",
    loadingCases: "正在读取案例数据...",
    caseListAria: "案例列表",
    noCasesTitle: "没有找到匹配案例",
    noCasesCopy: "试试减少筛选条件，或换一个关键词。",
    casePaginationAria: "案例分页",
    resourceDashboardAria: "资源库概览",
    resourcesCollected: "已收录资源",
    regionsOrOrgs: "地区/组织来源",
    resourceTypes: "资源类型",
    resourceToolbarAria: "资源检索和筛选",
    resourceSearchPlaceholder: "搜索标题、简介、适用方式、发布机构或地区",
    audience: "受众",
    resourceType: "资源类型",
    category: "类别",
    accessType: "访问方式",
    loadingResources: "正在读取资源数据...",
    resourceListAria: "资源列表",
    noResourcesTitle: "没有找到匹配资源",
    noResourcesCopy: "试试减少筛选条件，或换一个关键词。",
    resourcePaginationAria: "资源分页",
    promptDashboardAria: "Prompt 模板库概览",
    promptTemplates: "Prompt 模板",
    subjectsOrTopics: "学科/主题",
    promptTypes: "Prompt 类型",
    promptTaskLauncherAria: "教师任务入口",
    promptTaskLauncherEyebrow: "Teacher Workflows",
    promptTaskLauncherTitle: "我要做什么",
    promptToolbarAria: "Prompt 检索和筛选",
    promptSearchPlaceholder: "搜索学科、用途、Prompt 内容或来源",
    subject: "学科",
    promptType: "Prompt 类型",
    outputFormat: "输出格式",
    loadingPrompts: "正在读取 Prompt 数据...",
    promptListAria: "Prompt 模板列表",
    noPromptsTitle: "没有找到匹配 Prompt",
    noPromptsCopy: "试试减少筛选条件，或换一个关键词。",
    promptPaginationAria: "Prompt 分页",
    toolkitAria: "教师 AI 工具箱",
    toolkitEyebrow: "Teacher AI Toolkit",
    toolkitTitle: "教师 AI 工具箱",
    toolkitStatusNoApi: "本地生成，不消耗 API",
    toolPromptMakerEyebrow: "Prompt Builder",
    toolPromptMakerTitle: "教学 Prompt 生成器",
    toolTask: "教师任务",
    toolSubjectInput: "学科",
    toolLevelInput: "学段",
    toolTopicInput: "主题",
    toolStudentNeeds: "学生情况",
    toolDuration: "课堂时间",
    toolOutputLanguage: "输出语言",
    toolAiTool: "AI 工具",
    toolGenerate: "生成",
    toolOutputTitle: "可复制结果",
    toolTopicPlaceholder: "例如：二次函数、英文议论文、生态系统",
    toolNeedsPlaceholder: "例如：基础差异大、需要双语支持、班上有高能力学生",
    toolSavedPackEyebrow: "Lesson Pack",
    toolSavedPackTitle: "收藏备课包导出",
    toolSavedCases: "案例",
    toolSavedResources: "资源",
    toolSavedPrompts: "Prompt",
    toolExportSaved: "生成收藏清单",
    toolCopySaved: "复制清单",
    toolSavedEmpty: "还没有收藏内容。可以先在案例、资源或 Prompt 卡片点击收藏。",
    toolAgreementEyebrow: "AI Rules",
    toolAgreementTitle: "课堂 AI 使用守则",
    toolAllowedUse: "允许用途",
    toolAssessmentRule: "评价规则",
    toolPrivacyRule: "隐私规则",
    toolGenerateAgreement: "生成守则",
    toolCopyAgreement: "复制守则",
    toolSpecialistEyebrow: "Quick Tools",
    toolSpecialistTitle: "专项模板生成器",
    toolSpecialistType: "专项任务",
    toolSpecialistGoal: "学习目标",
    toolSpecialistMaterial: "原始材料 / 学生作品",
    toolSpecialistConstraints: "约束条件",
    toolSpecialistGoalPlaceholder: "例如：能用证据支持观点",
    toolSpecialistMaterialPlaceholder: "粘贴课文、题目、学生作品片段或任务说明",
    toolSpecialistConstraintsPlaceholder: "例如：语气鼓励、三档难度、不要直接给答案",
    toolGenerateSpecial: "生成专项 Prompt",
    toolCopySpecial: "复制专项 Prompt",
    assistantAria: "AI 助手",
    assistantEyebrow: "RAG Research Assistant",
    openModelScope: "打开魔搭应用",
    assistantEmptyTitle: "AI 助手待连接",
    assistantEmptyCopy: "魔搭 Studio 应用地址配置后，这里会显示有限额 RAG 问答窗口。",
    assistantLoadErrorTitle: "AI 助手配置读取失败",
    assistantLoadErrorCopy: "请确认 {url} 可以访问。",
    footerNote:
      "数据维护：编辑 data/cases.csv、data/resources.csv 或 data/prompts.csv 后提交到 GitHub Pages 即可更新。",
    all: "全部",
    notMarked: "未标注",
    previousPage: "上一页",
    nextPage: "下一页",
    pageStatus: "第 {page} / {totalPages} 页",
    copied: "已复制",
    copyFailed: "复制失败",
    workflowTitle: "可复制工作流",
    copyWorkflow: "复制工作流",
    useCase: "适用方式",
    promptCopyTitle: "可复制 Prompt",
    copyPrompt: "复制 Prompt",
    promptVariables: "输入变量",
    published: "发布",
    accessed: "访问",
    viewSource: "查看来源",
    openResource: "打开资源",
    sourceLink: "来源",
    reference: "参考",
    publisher: "发布机构",
    subjectTopic: "学科/主题",
    outputFormatMeta: "输出格式",
    aiTool: "AI工具",
    sortDateDesc: "发布日期：新到旧",
    sortDateAsc: "发布日期：旧到新",
    sortTitleAsc: "标题：A-Z",
    sortRegionAsc: "地区：A-Z",
    sortPublisherAsc: "发布机构：A-Z",
    sortSubjectAsc: "学科：A-Z",
    sortTypeAsc: "类型：A-Z",
    sortQualityDesc: "质量评分：高到低",
    allCases: "全部案例",
    allResources: "全部资源",
    allPrompts: "全部 Prompt",
    resourceTitle: "{category} 资源",
    promptTitle: "{subject} Prompt",
    caseCount: "{count} 条案例",
    caseCountWithCandidates: "{count} 条案例 + {candidateCount} 条候选",
    resourceCount: "{count} 条资源",
    promptCount: "{count} 个 Prompt",
    caseResultsEmpty: "显示 0 / {total} 条案例",
    caseResultsRange: "显示 {first}-{last} / {shown} 条案例（总库 {total} 条）",
    resourceResultsEmpty: "显示 0 / {total} 条资源",
    resourceResultsRange: "显示 {first}-{last} / {shown} 条资源（总库 {total} 条）",
    promptResultsEmpty: "显示 0 / {total} 条 Prompt",
    promptResultsRange: "显示 {first}-{last} / {shown} 条 Prompt（总库 {total} 条）",
    loadErrorTitle: "数据读取失败",
    loadErrorMeta: "请确认 {url} 可以访问。",
    csvErrorTitle: "无法读取 CSV",
    fallbackCaseLabel: "案例",
    fallbackCaseGoal: "目标：围绕{topic}设计一节AI辅助学习活动。",
    fallbackCaseFlow:
      "流程：1. 给学生一个真实问题；2. 用{tool}生成、比较或反馈；3. 让学生记录判断依据；4. 分享作品并反思AI的帮助和局限。",
    fallbackCaseOutput: "产出：一份学习作品、一段反思或一张评价表。",
  },
  en: {
    documentTitle: "AIED Case Hub | AI Education Library",
    documentDescription:
      "AIED Case Hub collects AI teaching cases, global curriculum resources and teacher-ready prompt templates with filters by subject, level, language, region and type.",
    skipLink: "Skip to content list",
    eyebrow: "AI Education Library",
    subtitle: "AI teaching cases, curriculum resources, prompt templates and a RAG assistant",
    mainTabsAria: "Content tabs",
    dataActionsAria: "Data actions",
    languageLabel: "Language",
    languageSelectAria: "Select interface language",
    dataMenu: "Data links",
    expandMenu: "Expand",
    collapseMenu: "Collapse",
    casesCsv: "Cases CSV",
    candidateCsv: "Candidates CSV",
    resourcesCsv: "Resources CSV",
    promptsCsv: "Prompt CSV",
    tabCases: "Teaching Cases",
    tabResources: "Resources",
    tabPrompts: "Prompt Templates",
    tabToolkit: "Teacher Tools",
    toolkitTabStatus: "Copy-ready",
    tabAssistant: "AI Assistant",
    assistantStatusTrial: "Trial quota",
    assistantStatusPending: "Not connected",
    assistantStatusConnected: "Connected",
    caseDashboardAria: "Case library overview",
    dashboardSummary: "Overview",
    casesCollected: "Collected cases",
    hkPriorityCases: "Hong Kong-priority cases",
    topCategories: "Top categories",
    latestAccessed: "Latest access date",
    latestVerified: "Latest verification",
    learningPathsEyebrow: "Curated Pathways",
    learningPathsTitle: "Learning pathways",
    learningPathsCopy: "Combine cases, resources and prompts into a ready-to-use planning route.",
    viewAllPaths: "View all pathways",
    openPath: "Open pathway",
    pathSteps: "{count} steps",
    candidatePool: "Auto candidate pool",
    candidateCount: "{count} candidates pending review",
    candidateNote:
      "New matches publish with quality labels by default. This pool is used only when an optional minimum score is enabled.",
    showCandidates: "View candidates",
    hideCandidates: "Hide candidates",
    candidatePreviewTitle: "Latest candidates",
    candidateReviewBadge: "Pending review",
    autoCollected: "Auto collected",
    caseToolbarAria: "Case search and filters",
    caseCategoryAria: "Case categories",
    filterSummary: "Search and filters",
    filterExpand: "Expand filters",
    filterCollapse: "Collapse filters",
    keyword: "Keyword",
    caseSearchPlaceholder: "Search titles, summaries, workflows, regions, tools or sources",
    subcategory: "Subcategory",
    teacherTask: "Teacher task",
    favorites: "Saved",
    favoritesOnly: "Saved only",
    educationLevel: "Level",
    language: "Language",
    region: "Region",
    source: "Source",
    credibility: "Credibility",
    aiType: "AI type",
    quality: "Content quality",
    qualityScore: "Quality score",
    linkStatus: "Link status",
    httpStatus: "HTTP status",
    resolvedUrl: "Resolved URL",
    lastVerified: "Last verified",
    skillDomain: "Skill domain",
    evidenceStrength: "Evidence strength",
    teachingGoal: "Teaching goal",
    implementation: "Implementation",
    outcomesEvidence: "Outcome evidence",
    limitations: "Conditions and limitations",
    requiredInputs: "Required inputs",
    optionalInputs: "Optional inputs",
    outputSchema: "Output schema",
    promptLimitations: "Limitations",
    nextSteps: "Next step",
    verificationChecklist: "Post-generation checks",
    privacyNote: "Privacy note",
    skillStructure: "View teaching skill structure",
    sort: "Sort",
    reset: "Reset",
    addFavorite: "Save",
    removeFavorite: "Saved",
    details: "Details",
    backToCases: "Back to cases",
    caseDetailHeading: "Case details",
    teacherTasks: "Teacher tasks",
    copyDetailLink: "Copy detail link",
    detailLinkCopied: "Detail link copied",
    loadingCases: "Loading case data...",
    caseListAria: "Case list",
    noCasesTitle: "No matching cases",
    noCasesCopy: "Try fewer filters or a different keyword.",
    casePaginationAria: "Case pagination",
    resourceDashboardAria: "Resource library overview",
    resourcesCollected: "Collected resources",
    regionsOrOrgs: "Regions / organizations",
    resourceTypes: "Resource types",
    resourceToolbarAria: "Resource search and filters",
    resourceSearchPlaceholder: "Search titles, summaries, use cases, publishers or regions",
    audience: "Audience",
    resourceType: "Resource type",
    category: "Category",
    accessType: "Access",
    loadingResources: "Loading resource data...",
    resourceListAria: "Resource list",
    noResourcesTitle: "No matching resources",
    noResourcesCopy: "Try fewer filters or a different keyword.",
    resourcePaginationAria: "Resource pagination",
    promptDashboardAria: "Prompt template overview",
    promptTemplates: "Prompt templates",
    subjectsOrTopics: "Subjects / topics",
    promptTypes: "Prompt types",
    promptTaskLauncherAria: "Teacher task entry",
    promptTaskLauncherEyebrow: "Teacher Workflows",
    promptTaskLauncherTitle: "What do you want to make?",
    promptToolbarAria: "Prompt search and filters",
    promptSearchPlaceholder: "Search subjects, uses, prompt text or sources",
    subject: "Subject",
    promptType: "Prompt type",
    outputFormat: "Output format",
    loadingPrompts: "Loading prompt data...",
    promptListAria: "Prompt template list",
    noPromptsTitle: "No matching prompts",
    noPromptsCopy: "Try fewer filters or a different keyword.",
    promptPaginationAria: "Prompt pagination",
    toolkitAria: "Teacher AI toolkit",
    toolkitEyebrow: "Teacher AI Toolkit",
    toolkitTitle: "Teacher AI Toolkit",
    toolkitStatusNoApi: "Generated locally, no API needed",
    toolPromptMakerEyebrow: "Prompt Builder",
    toolPromptMakerTitle: "Teaching Prompt Generator",
    toolTask: "Teacher task",
    toolSubjectInput: "Subject",
    toolLevelInput: "Level",
    toolTopicInput: "Topic",
    toolStudentNeeds: "Student context",
    toolDuration: "Class time",
    toolOutputLanguage: "Output language",
    toolAiTool: "AI tool",
    toolGenerate: "Generate",
    toolOutputTitle: "Copy-ready output",
    toolTopicPlaceholder: "e.g. quadratic functions, argumentative writing, ecosystems",
    toolNeedsPlaceholder: "e.g. mixed readiness, bilingual support, high-ability students",
    toolSavedPackEyebrow: "Lesson Pack",
    toolSavedPackTitle: "Export Saved Lesson Pack",
    toolSavedCases: "cases",
    toolSavedResources: "resources",
    toolSavedPrompts: "prompts",
    toolExportSaved: "Generate saved list",
    toolCopySaved: "Copy list",
    toolSavedEmpty: "No saved items yet. Save case, resource or prompt cards first.",
    toolAgreementEyebrow: "AI Rules",
    toolAgreementTitle: "Classroom AI Use Rules",
    toolAllowedUse: "Allowed use",
    toolAssessmentRule: "Assessment rule",
    toolPrivacyRule: "Privacy rule",
    toolGenerateAgreement: "Generate rules",
    toolCopyAgreement: "Copy rules",
    toolSpecialistEyebrow: "Quick Tools",
    toolSpecialistTitle: "Specialized Template Generator",
    toolSpecialistType: "Task type",
    toolSpecialistGoal: "Learning goal",
    toolSpecialistMaterial: "Source material / student work",
    toolSpecialistConstraints: "Constraints",
    toolSpecialistGoalPlaceholder: "e.g. support claims with evidence",
    toolSpecialistMaterialPlaceholder: "Paste a text, question, student work sample or task brief",
    toolSpecialistConstraintsPlaceholder: "e.g. encouraging tone, three difficulty levels, do not give direct answers",
    toolGenerateSpecial: "Generate specialized prompt",
    toolCopySpecial: "Copy specialized prompt",
    assistantAria: "AI assistant",
    assistantEyebrow: "RAG Research Assistant",
    openModelScope: "Open ModelScope app",
    assistantEmptyTitle: "AI Assistant not connected",
    assistantEmptyCopy: "After a ModelScope Studio app URL is configured, the limited-quota RAG chat window will appear here.",
    assistantLoadErrorTitle: "AI Assistant config failed to load",
    assistantLoadErrorCopy: "Please confirm {url} is accessible.",
    footerNote:
      "Data maintenance: edit data/cases.csv, data/resources.csv or data/prompts.csv and commit to GitHub Pages to update the site.",
    all: "All",
    notMarked: "Not marked",
    previousPage: "Previous",
    nextPage: "Next",
    pageStatus: "Page {page} of {totalPages}",
    copied: "Copied",
    copyFailed: "Copy failed",
    workflowTitle: "Copy-ready workflow",
    copyWorkflow: "Copy workflow",
    useCase: "How to use",
    promptCopyTitle: "Copy-ready prompt",
    copyPrompt: "Copy prompt",
    promptVariables: "Inputs",
    published: "Published",
    accessed: "Accessed",
    viewSource: "View source",
    openResource: "Open resource",
    sourceLink: "Source",
    reference: "Reference",
    publisher: "Publisher",
    subjectTopic: "Subject / topic",
    outputFormatMeta: "Output format",
    aiTool: "AI tool",
    sortDateDesc: "Published: newest first",
    sortDateAsc: "Published: oldest first",
    sortTitleAsc: "Title: A-Z",
    sortRegionAsc: "Region: A-Z",
    sortPublisherAsc: "Publisher: A-Z",
    sortSubjectAsc: "Subject: A-Z",
    sortTypeAsc: "Type: A-Z",
    sortQualityDesc: "Quality: high to low",
    allCases: "All cases",
    allResources: "All resources",
    allPrompts: "All prompts",
    resourceTitle: "{category} resources",
    promptTitle: "{subject} prompts",
    caseCount: "{count} cases",
    caseCountWithCandidates: "{count} cases + {candidateCount} candidates",
    resourceCount: "{count} resources",
    promptCount: "{count} prompts",
    caseResultsEmpty: "Showing 0 of {total} cases",
    caseResultsRange: "Showing {first}-{last} of {shown} cases ({total} total)",
    resourceResultsEmpty: "Showing 0 of {total} resources",
    resourceResultsRange: "Showing {first}-{last} of {shown} resources ({total} total)",
    promptResultsEmpty: "Showing 0 of {total} prompts",
    promptResultsRange: "Showing {first}-{last} of {shown} prompts ({total} total)",
    loadErrorTitle: "Data failed to load",
    loadErrorMeta: "Please confirm {url} is accessible.",
    csvErrorTitle: "Could not read CSV",
    fallbackCaseLabel: "Case",
    fallbackCaseGoal: "Goal: design an AI-supported learning activity around {topic}.",
    fallbackCaseFlow:
      "Workflow: 1. Give students an authentic question; 2. Use {tool} to generate, compare or give feedback; 3. Ask students to record their reasoning; 4. Share work and reflect on AI's support and limits.",
    fallbackCaseOutput: "Output: a learning artifact, a reflection or an assessment checklist.",
  },
};

const VALUE_EN = {
  全部: "All",
  香港: "Hong Kong",
  中国内地: "Mainland China",
  大中华地区: "Greater China",
  台湾: "Taiwan",
  新加坡: "Singapore",
  美国: "United States",
  英国: "United Kingdom",
  欧盟: "European Union",
  澳大利亚: "Australia",
  全球: "Global",
  全球组织: "Global organization",
  中文: "Chinese",
  双语: "Bilingual",
  中文简体: "Simplified Chinese",
  中文繁体: "Traditional Chinese",
  英文: "English",
  小学: "Primary",
  中学: "Secondary",
  高等教育: "Higher education",
  教师教育: "Teacher education",
  中小学: "K-12",
  "中小学/高等教育": "K-12 / higher education",
  "小学/中学": "Primary / secondary",
  "小学/中学/高等教育": "Primary / secondary / higher education",
  混合: "Mixed",
  教师: "Teachers",
  学生: "Students",
  "教师/学校领导/教师培训者": "Teachers / school leaders / teacher trainers",
  "政策制定者/课程设计者/研究者": "Policymakers / curriculum designers / researchers",
  "学生/教师/课程设计者": "Students / teachers / curriculum designers",
  "教育管理者/教师/研究者": "Education leaders / teachers / researchers",
  "教师/课程主任": "Teachers / curriculum leaders",
  官方: "Official",
  "官方/学校": "Official / school",
  "论文/研究": "Paper / research",
  教师实践: "Teacher practice",
  媒体报道: "Media report",
  "课程/教材": "Course / curriculum",
  教师指南: "Teacher guide",
  政策框架: "Policy framework",
  课堂工具包: "Classroom toolkit",
  学生课程: "Student course",
  资源目录: "Resource directory",
  研究报告: "Research report",
  免费: "Free",
  需注册: "Registration required",
  "付费/订阅": "Paid / subscription",
  未知: "Unknown",
  高质量: "High quality",
  资料完整: "Complete",
  基本可用: "Usable",
  资料不完整: "Incomplete",
  实践框架: "Practice-informed",
  强: "Strong",
  中等: "Moderate",
  初步: "Emerging",
  unverified: "Not verified",
  ok: "Verified",
  redirected: "Verified redirect",
  blocked: "Automated check blocked",
  broken: "Possibly broken",
  error: "Check failed",
  课程设计与评价: "Curriculum design and assessment",
  教材与认知支架: "Materials and cognitive scaffolds",
  练习与学习科学: "Practice and learning science",
  评价与反馈: "Assessment and feedback",
  包容性设计: "Inclusive design",
  项目式学习: "Project-based learning",
  "提问、讨论与课堂互动": "Questioning, discussion and interaction",
  元认知与学生支持: "Metacognition and student support",
  备课设计: "Lesson planning",
  教材生成: "Material generation",
  "学习单/教材": "Worksheets / materials",
  练习与作业: "Practice and homework",
  评价反馈: "Assessment feedback",
  差异化支持: "Differentiated support",
  项目学习: "Project-based learning",
  课堂活动: "Classroom activity",
  家校沟通: "Family-school communication",
  学生支持: "Student support",
  AI素养: "AI literacy",
  语言学习: "Language learning",
  STEM探究: "STEM inquiry",
  艺术创作: "Arts creation",
  资源规划: "Resource planning",
  "行政与教学管理": "Admin and teaching management",
  "研究与政策": "Research and policy",
  "通用生成式 AI": "General generative AI",
  开放使用: "Open use",
  保守使用: "Limited use",
  只作过程支持: "Process support only",
  可计入过程证据: "Can count as process evidence",
  不计入成绩: "Not counted in grades",
  不输入个人资料: "No personal data",
  只输入匿名资料: "Anonymous data only",
  可输入课堂材料: "Classroom materials allowed",
  评价量规: "Rubric",
  分层改写: "Differentiated rewrite",
  反馈语: "Feedback comments",
  家校沟通: "Family-school message",
  课堂提问: "Classroom questions",
  "退出卡/小测": "Exit ticket / quiz",
  生成学习单: "Create worksheets",
  设计课堂活动: "Design activities",
  制作评价量规: "Make rubrics",
  改写分层材料: "Differentiate materials",
  设计AI素养课: "Plan AI literacy",
  做项目学习: "Plan projects",
  支持个别学生: "Support students",
  写家校沟通: "Family messages",
  找教学案例: "Find cases",
  找教材资源: "Find resources",
  通用备课: "General lesson planning",
  通用单元设计: "General unit design",
  通用课堂活动: "General classroom activity",
  通用分层教学: "General differentiated instruction",
};

const TRADITIONAL_PHRASES = [
  ["人工智能", "人工智能"],
  ["生成式人工智能", "生成式人工智能"],
  ["AI 教育教学案例", "AI 教育教學案例"],
  ["教材资源", "教材資源"],
  ["资料库", "資料庫"],
  ["教学案例", "教學案例"],
  ["教师", "教師"],
  ["学生", "學生"],
  ["课程", "課程"],
  ["课堂", "課堂"],
  ["学习", "學習"],
  ["数据库", "資料庫"],
  ["访问", "訪問"],
  ["资源", "資源"],
  ["案例", "案例"],
  ["简体中文", "簡體中文"],
  ["繁体中文", "繁體中文"],
];

const TRADITIONAL_CHARS = {
  万: "萬",
  与: "與",
  专: "專",
  业: "業",
  东: "東",
  丝: "絲",
  严: "嚴",
  个: "個",
  临: "臨",
  为: "為",
  举: "舉",
  义: "義",
  乌: "烏",
  乐: "樂",
  习: "習",
  书: "書",
  买: "買",
  乱: "亂",
  争: "爭",
  于: "於",
  云: "雲",
  亚: "亞",
  产: "產",
  亲: "親",
  仅: "僅",
  从: "從",
  仑: "侖",
  仓: "倉",
  仪: "儀",
  们: "們",
  优: "優",
  会: "會",
  传: "傳",
  伤: "傷",
  伦: "倫",
  伪: "偽",
  体: "體",
  余: "餘",
  佛: "佛",
  作: "作",
  你: "你",
  侠: "俠",
  侣: "侶",
  侦: "偵",
  侧: "側",
  侨: "僑",
  侩: "儈",
  侪: "儕",
  侬: "儂",
  俭: "儉",
  债: "債",
  倾: "傾",
  偿: "償",
  储: "儲",
  儿: "兒",
  兑: "兌",
  党: "黨",
  兰: "蘭",
  关: "關",
  兴: "興",
  养: "養",
  内: "內",
  册: "冊",
  写: "寫",
  军: "軍",
  农: "農",
  冲: "衝",
  决: "決",
  况: "況",
  净: "淨",
  准: "準",
  几: "幾",
  击: "擊",
  则: "則",
  刚: "剛",
  创: "創",
  删: "刪",
  别: "別",
  刬: "剗",
  刹: "剎",
  制: "制",
  剂: "劑",
  剑: "劍",
  剧: "劇",
  务: "務",
  动: "動",
  励: "勵",
  劲: "勁",
  劳: "勞",
  势: "勢",
  勋: "勳",
  区: "區",
  医: "醫",
  华: "華",
  协: "協",
  单: "單",
  卖: "賣",
  卢: "盧",
  卫: "衛",
  历: "歷",
  压: "壓",
  县: "縣",
  参: "參",
  双: "雙",
  发: "發",
  变: "變",
  叙: "敘",
  叶: "葉",
  号: "號",
  后: "後",
  向: "向",
  吗: "嗎",
  启: "啟",
  员: "員",
  咨: "諮",
  咸: "鹹",
  响: "響",
  哑: "啞",
  哟: "喲",
  唤: "喚",
  售: "售",
  啦: "啦",
  喷: "噴",
  嘱: "囑",
  团: "團",
  园: "園",
  困: "困",
  国: "國",
  图: "圖",
  圆: "圓",
  圣: "聖",
  场: "場",
  块: "塊",
  坚: "堅",
  坛: "壇",
  坝: "壩",
  坞: "塢",
  垄: "壟",
  垅: "壠",
  型: "型",
  垒: "壘",
  垦: "墾",
  垩: "堊",
  垫: "墊",
  垭: "埡",
  垱: "壋",
  垲: "塏",
  埙: "塤",
  埚: "堝",
  堑: "塹",
  墙: "牆",
  壮: "壯",
  声: "聲",
  壳: "殼",
  壶: "壺",
  处: "處",
  备: "備",
  复: "復",
  够: "夠",
  头: "頭",
  夹: "夾",
  夺: "奪",
  奖: "獎",
  奥: "奧",
  妆: "妝",
  妇: "婦",
  妈: "媽",
  姜: "薑",
  娄: "婁",
  娅: "婭",
  娆: "嬈",
  娇: "嬌",
  娈: "孌",
  娱: "娛",
  婴: "嬰",
  孙: "孫",
  学: "學",
  宁: "寧",
  宝: "寶",
  实: "實",
  审: "審",
  宪: "憲",
  宫: "宮",
  宽: "寬",
  宾: "賓",
  对: "對",
  寻: "尋",
  导: "導",
  寿: "壽",
  将: "將",
  尔: "爾",
  尘: "塵",
  尝: "嘗",
  尧: "堯",
  尴: "尷",
  尽: "盡",
  层: "層",
  屉: "屜",
  属: "屬",
  岁: "歲",
  岂: "豈",
  岛: "島",
  岭: "嶺",
  岳: "嶽",
  峡: "峽",
  峦: "巒",
  巅: "巔",
  巩: "鞏",
  币: "幣",
  帅: "帥",
  师: "師",
  帐: "帳",
  带: "帶",
  帧: "幀",
  帮: "幫",
  干: "幹",
  并: "並",
  广: "廣",
  庄: "莊",
  庆: "慶",
  庐: "廬",
  库: "庫",
  应: "應",
  庙: "廟",
  庞: "龐",
  废: "廢",
  开: "開",
  异: "異",
  弃: "棄",
  张: "張",
  弥: "彌",
  弯: "彎",
  当: "當",
  录: "錄",
  彦: "彥",
  彩: "彩",
  彻: "徹",
  征: "徵",
  径: "徑",
  忆: "憶",
  忏: "懺",
  忧: "憂",
  忾: "愾",
  怀: "懷",
  态: "態",
  怂: "慫",
  怜: "憐",
  总: "總",
  恶: "惡",
  恳: "懇",
  恸: "慟",
  恹: "懨",
  恺: "愷",
  恻: "惻",
  恼: "惱",
  悦: "悅",
  悮: "悞",
  惊: "驚",
  惧: "懼",
  惨: "慘",
  惩: "懲",
  惫: "憊",
  惬: "愜",
  惭: "慚",
  惮: "憚",
  惯: "慣",
  愤: "憤",
  愦: "憒",
  愿: "願",
  慑: "懾",
  懑: "懣",
  戏: "戲",
  战: "戰",
  户: "戶",
  扑: "撲",
  执: "執",
  扩: "擴",
  扪: "捫",
  扫: "掃",
  扬: "揚",
  扰: "擾",
  抚: "撫",
  抛: "拋",
  抟: "摶",
  抠: "摳",
  抡: "掄",
  抢: "搶",
  护: "護",
  报: "報",
  担: "擔",
  拟: "擬",
  拢: "攏",
  拣: "揀",
  拥: "擁",
  拦: "攔",
  拧: "擰",
  拨: "撥",
  择: "擇",
  挂: "掛",
  挚: "摯",
  挛: "攣",
  挜: "掗",
  挝: "撾",
  挞: "撻",
  挟: "挾",
  挠: "撓",
  挡: "擋",
  挢: "撟",
  挣: "掙",
  挤: "擠",
  挥: "揮",
  捞: "撈",
  损: "損",
  捡: "撿",
  换: "換",
  捣: "搗",
  据: "據",
  掳: "擄",
  掴: "摑",
  掷: "擲",
  掸: "撣",
  掺: "摻",
  掼: "摜",
  揽: "攬",
  搀: "攙",
  搁: "擱",
  搂: "摟",
  搅: "攪",
  携: "攜",
  摄: "攝",
  摆: "擺",
  摇: "搖",
  摈: "擯",
  摊: "攤",
  撄: "攖",
  撑: "撐",
  撵: "攆",
  撷: "擷",
 撸: "擼",
  撺: "攛",
  擞: "擻",
  攒: "攢",
  敌: "敵",
  敛: "斂",
  数: "數",
  斋: "齋",
  斓: "斕",
  斗: "鬥",
  斩: "斬",
  断: "斷",
  无: "無",
  旧: "舊",
  时: "時",
  昙: "曇",
  昼: "晝",
  显: "顯",
  晋: "晉",
  晒: "曬",
  晓: "曉",
  晕: "暈",
  暂: "暫",
  术: "術",
  机: "機",
  杀: "殺",
  杂: "雜",
  权: "權",
  条: "條",
  来: "來",
  杨: "楊",
  杩: "榪",
  杰: "傑",
  极: "極",
  构: "構",
  枢: "樞",
  枣: "棗",
  枪: "槍",
  枫: "楓",
  枭: "梟",
  柜: "櫃",
  标: "標",
  栈: "棧",
  栉: "櫛",
  栋: "棟",
  栌: "櫨",
  栎: "櫟",
  栏: "欄",
  树: "樹",
  栖: "棲",
  样: "樣",
  栾: "欒",
  桠: "椏",
  桡: "橈",
  桢: "楨",
  档: "檔",
  桤: "榿",
  桥: "橋",
  桦: "樺",
  桧: "檜",
  桨: "槳",
  桩: "樁",
  梦: "夢",
  梼: "檮",
  梾: "棶",
  梿: "槤",
  检: "檢",
  棂: "欞",
  椁: "槨",
  椟: "櫝",
  椠: "槧",
  椤: "欏",
  椭: "橢",
  楼: "樓",
  榄: "欖",
  榅: "榲",
  榇: "櫬",
  榈: "櫚",
  榉: "櫸",
  槚: "檟",
  槛: "檻",
  槟: "檳",
  槠: "櫧",
  横: "橫",
  樯: "檣",
  樱: "櫻",
  橥: "櫫",
  橱: "櫥",
  橹: "櫓",
  橼: "櫞",
  檩: "檁",
  欢: "歡",
  欤: "歟",
  欧: "歐",
  欲: "慾",
  歼: "殲",
  殁: "歿",
  残: "殘",
  殒: "殞",
  殓: "殮",
  殚: "殫",
  殡: "殯",
  殴: "毆",
  毁: "毀",
  毕: "畢",
  毙: "斃",
  毡: "氈",
  气: "氣",
  氢: "氫",
  氧: "氧",
  氨: "氨",
  氩: "氬",
  氲: "氳",
  汉: "漢",
  汤: "湯",
  汹: "洶",
  沟: "溝",
  没: "沒",
  沣: "灃",
  沤: "漚",
  沥: "瀝",
  沦: "淪",
  沧: "滄",
  沨: "渢",
  沪: "滬",
  泞: "濘",
  泪: "淚",
  泶: "澩",
  泷: "瀧",
  泸: "瀘",
  泺: "濼",
  泻: "瀉",
  泼: "潑",
  泽: "澤",
  洁: "潔",
  洒: "灑",
  洼: "窪",
  浅: "淺",
  浆: "漿",
  浇: "澆",
  浈: "湞",
  浊: "濁",
  测: "測",
  济: "濟",
  浏: "瀏",
  浑: "渾",
  浒: "滸",
  浓: "濃",
  浔: "潯",
  涛: "濤",
  涝: "澇",
  涞: "淶",
  涟: "漣",
  涠: "潿",
  涡: "渦",
  涢: "溳",
  涣: "渙",
  涤: "滌",
  润: "潤",
  涧: "澗",
  涨: "漲",
  涩: "澀",
  淀: "澱",
  渊: "淵",
  渍: "漬",
  渎: "瀆",
  渐: "漸",
  渑: "澠",
  渔: "漁",
  渖: "瀋",
  渗: "滲",
  温: "溫",
  湾: "灣",
  湿: "濕",
  溃: "潰",
  溅: "濺",
  滚: "滾",
  滞: "滯",
  滟: "灧",
  滠: "灄",
  满: "滿",
  滢: "瀅",
  滤: "濾",
  滥: "濫",
  滦: "灤",
  滨: "濱",
  滩: "灘",
  滪: "澦",
  漓: "灕",
  漤: "灠",
  潆: "瀠",
  潇: "瀟",
  潋: "瀲",
  潍: "濰",
  潜: "潛",
  潴: "瀦",
  澜: "瀾",
  濑: "瀨",
  濒: "瀕",
  灏: "灝",
  灭: "滅",
  灯: "燈",
  灵: "靈",
  灾: "災",
  灿: "燦",
  炀: "煬",
  炉: "爐",
  炖: "燉",
  炜: "煒",
  炝: "熗",
  点: "點",
  炼: "煉",
  炽: "熾",
  烁: "爍",
  烂: "爛",
  烃: "烴",
  烛: "燭",
  烟: "煙",
  烦: "煩",
  烧: "燒",
  烨: "燁",
  烩: "燴",
  烫: "燙",
  烬: "燼",
  热: "熱",
  焕: "煥",
  焖: "燜",
  煴: "熅",
  爱: "愛",
  爷: "爺",
  牍: "牘",
  牵: "牽",
  牺: "犧",
  犊: "犢",
  状: "狀",
  犷: "獷",
  犸: "獁",
  犹: "猶",
  狈: "狽",
  狞: "獰",
  独: "獨",
  狭: "狹",
  狮: "獅",
  狯: "獪",
  狰: "猙",
  狱: "獄",
  狲: "猻",
  猎: "獵",
  猕: "獼",
  猡: "玀",
  猫: "貓",
  献: "獻",
  獭: "獺",
  玑: "璣",
  玚: "瑒",
  玛: "瑪",
  玮: "瑋",
  环: "環",
  现: "現",
  玱: "瑲",
  玺: "璽",
  珐: "琺",
  珑: "瓏",
  珲: "琿",
  琏: "璉",
  琐: "瑣",
  琼: "瓊",
  瑶: "瑤",
  瑷: "璦",
  璎: "瓔",
  瓒: "瓚",
  瓮: "甕",
  电: "電",
  画: "畫",
  畅: "暢",
  畴: "疇",
  疖: "癤",
  疗: "療",
  疟: "瘧",
  疠: "癘",
  疡: "瘍",
  疬: "癧",
  疮: "瘡",
  疯: "瘋",
  疱: "皰",
  疴: "痾",
  痈: "癰",
  痉: "痙",
  痒: "癢",
  痨: "癆",
  痪: "瘓",
  痫: "癇",
  瘅: "癉",
  瘗: "瘞",
  瘘: "瘺",
  瘪: "癟",
  瘫: "癱",
  瘾: "癮",
  瘿: "癭",
  癞: "癩",
  癣: "癬",
  皑: "皚",
  皱: "皺",
  皲: "皸",
  盏: "盞",
  盐: "鹽",
  监: "監",
  盖: "蓋",
  盗: "盜",
  盘: "盤",
  眍: "瞘",
  眦: "眥",
  睁: "睜",
  睐: "睞",
  睑: "瞼",
  瞒: "瞞",
  瞩: "矚",
  矫: "矯",
  矶: "磯",
  矾: "礬",
  矿: "礦",
  砀: "碭",
  码: "碼",
  砖: "磚",
  砗: "硨",
  砚: "硯",
  砜: "碸",
  砺: "礪",
  砻: "礱",
  砾: "礫",
  础: "礎",
  硁: "硜",
  硕: "碩",
  硖: "硤",
  硗: "磽",
  硙: "磑",
  硚: "礄",
  确: "確",
  碍: "礙",
  碛: "磧",
  碜: "磣",
  礼: "禮",
  祎: "禕",
  祢: "禰",
  祯: "禎",
  祷: "禱",
  祸: "禍",
  禀: "稟",
  禄: "祿",
  禅: "禪",
  离: "離",
  秃: "禿",
  秆: "稈",
  种: "種",
  积: "積",
  称: "稱",
  秽: "穢",
  税: "稅",
  稣: "穌",
  稳: "穩",
  穑: "穡",
  穷: "窮",
  窃: "竊",
  窍: "竅",
  窑: "窯",
  窜: "竄",
  窝: "窩",
  窥: "窺",
  窦: "竇",
  窭: "窶",
  竖: "豎",
  竞: "競",
  笃: "篤",
  笋: "筍",
  笔: "筆",
  笕: "筧",
  笺: "箋",
  笼: "籠",
  笾: "籩",
  筚: "篳",
  筛: "篩",
  筜: "簹",
  筝: "箏",
  筹: "籌",
  筼: "篔",
  签: "簽",
  简: "簡",
  箓: "籙",
  箦: "簀",
  箧: "篋",
  箨: "籜",
  箩: "籮",
  箪: "簞",
  箫: "簫",
  篑: "簣",
  篓: "簍",
  篮: "籃",
  篱: "籬",
  簖: "籪",
  籁: "籟",
  籴: "糴",
  类: "類",
  籼: "秈",
  粜: "糶",
  粝: "糲",
  粤: "粵",
  粪: "糞",
  粮: "糧",
  糁: "糝",
  糇: "餱",
  糖: "糖",
  糗: "糗",
  糙: "糙",
  糨: "糨",
  系: "系",
  紧: "緊",
  累: "累",
  絷: "縶",
  纠: "糾",
  红: "紅",
  纣: "紂",
  纤: "纖",
  纥: "紇",
  约: "約",
  级: "級",
  纨: "紈",
  纩: "纊",
  纪: "紀",
  纫: "紉",
  纬: "緯",
  纭: "紜",
  纯: "純",
  纰: "紕",
  纱: "紗",
  纲: "綱",
  纳: "納",
  纵: "縱",
  纶: "綸",
  纷: "紛",
  纸: "紙",
  纹: "紋",
  纺: "紡",
  纽: "紐",
  纾: "紓",
  线: "線",
  绀: "紺",
  绁: "紲",
  绂: "紱",
  练: "練",
  组: "組",
  绅: "紳",
  细: "細",
  织: "織",
  终: "終",
  绉: "縐",
  绊: "絆",
  绋: "紼",
  绌: "絀",
  绍: "紹",
  绎: "繹",
  经: "經",
  绐: "紿",
  绑: "綁",
  绒: "絨",
  结: "結",
  绔: "絝",
  绕: "繞",
  绖: "絰",
  绘: "繪",
  给: "給",
  绚: "絢",
  绛: "絳",
  络: "絡",
  绝: "絕",
  绞: "絞",
  统: "統",
  绠: "綆",
  绡: "綃",
  绢: "絹",
  绣: "繡",
  绥: "綏",
  绦: "絛",
  继: "繼",
  绨: "綈",
  绩: "績",
  绪: "緒",
  绫: "綾",
  续: "續",
  绮: "綺",
  绯: "緋",
  绰: "綽",
  绱: "緔",
  绲: "緄",
  绳: "繩",
  维: "維",
  绵: "綿",
  绶: "綬",
  绷: "繃",
  绸: "綢",
  绺: "綹",
  绻: "綣",
  综: "綜",
  绽: "綻",
  绾: "綰",
  绿: "綠",
  缀: "綴",
  缁: "緇",
  缂: "緙",
  缃: "緗",
  缄: "緘",
  缅: "緬",
  缆: "纜",
  缇: "緹",
  缈: "緲",
  缉: "緝",
  缊: "縕",
  缋: "繢",
  缌: "緦",
  缍: "綞",
  缎: "緞",
  缏: "緶",
  缑: "緱",
  缒: "縋",
  缓: "緩",
  缔: "締",
  缕: "縷",
  编: "編",
  缗: "緡",
  缘: "緣",
  缙: "縉",
  缚: "縛",
  缛: "縟",
  缜: "縝",
  缝: "縫",
  缟: "縞",
  缠: "纏",
  缡: "縭",
  缢: "縊",
  缣: "縑",
  缤: "繽",
  缥: "縹",
  缦: "縵",
  缧: "縲",
  缨: "纓",
  缩: "縮",
  缪: "繆",
  缫: "繅",
  缬: "纈",
  缭: "繚",
  缮: "繕",
  缯: "繒",
  缰: "韁",
  缱: "繾",
  缲: "繰",
  缳: "繯",
  缴: "繳",
  缵: "纘",
  罂: "罌",
  网: "網",
  罗: "羅",
  罚: "罰",
  罢: "罷",
  羁: "羈",
  羟: "羥",
  翘: "翹",
  耢: "耮",
  耧: "耬",
  耸: "聳",
  聋: "聾",
  职: "職",
  联: "聯",
  聩: "聵",
  聪: "聰",
  肃: "肅",
  肠: "腸",
  肤: "膚",
  肮: "骯",
  肴: "餚",
  肾: "腎",
  肿: "腫",
  胀: "脹",
  胁: "脅",
  胆: "膽",
  胜: "勝",
  胧: "朧",
  胨: "腖",
  胪: "臚",
  胫: "脛",
  胶: "膠",
  脉: "脈",
  脍: "膾",
  脏: "髒",
  脐: "臍",
  脑: "腦",
  脓: "膿",
  脔: "臠",
  脚: "腳",
  脱: "脫",
  脶: "腡",
  脸: "臉",
  腊: "臘",
  腌: "醃",
  腘: "膕",
  腭: "齶",
  腻: "膩",
  腼: "靦",
  腾: "騰",
  膑: "臏",
  臜: "臢",
  舆: "輿",
  舣: "艤",
  舰: "艦",
  舱: "艙",
  艰: "艱",
  艳: "艷",
  艺: "藝",
  节: "節",
  芈: "羋",
  芗: "薌",
  芜: "蕪",
  芦: "蘆",
  苁: "蓯",
  苇: "葦",
  苈: "藶",
  苋: "莧",
  苌: "萇",
  苍: "蒼",
  苎: "苧",
  苏: "蘇",
  苹: "蘋",
  茎: "莖",
  茏: "蘢",
  茑: "蔦",
  茔: "塋",
  茕: "煢",
  茧: "繭",
  荆: "荊",
  荐: "薦",
  荙: "薘",
  荚: "莢",
  荛: "蕘",
  荜: "蓽",
  荞: "蕎",
  荟: "薈",
  荠: "薺",
  荡: "蕩",
  荣: "榮",
  荤: "葷",
  荥: "滎",
  荦: "犖",
  荧: "熒",
  荨: "蕁",
  荩: "藎",
  荪: "蓀",
  荫: "蔭",
  荬: "蕒",
  荭: "葒",
  荮: "葤",
  药: "藥",
  莅: "蒞",
  莱: "萊",
  莲: "蓮",
  莳: "蒔",
  莴: "萵",
  莶: "薟",
  获: "獲",
  莹: "瑩",
  莺: "鶯",
  莼: "蓴",
  萚: "蘀",
  萝: "蘿",
  萤: "螢",
  营: "營",
  萦: "縈",
  萧: "蕭",
  萨: "薩",
  葱: "蔥",
  蒇: "蕆",
  蒉: "蕢",
  蒋: "蔣",
  蒌: "蔞",
  蓝: "藍",
  蓟: "薊",
  蓠: "蘺",
  蓣: "蕷",
  蓥: "鎣",
  蓦: "驀",
  蔷: "薔",
  蔹: "蘞",
  蔺: "藺",
  蔼: "藹",
  蕲: "蘄",
  蕴: "蘊",
  薮: "藪",
  藓: "蘚",
  蘖: "櫱",
  虏: "虜",
  虑: "慮",
  虚: "虛",
  虫: "蟲",
  虬: "虯",
  虮: "蟣",
  虱: "蝨",
  虽: "雖",
  虾: "蝦",
  虿: "蠆",
  蚀: "蝕",
  蚁: "蟻",
  蚂: "螞",
  蚕: "蠶",
  蚝: "蠔",
  蚬: "蜆",
  蛊: "蠱",
  蛎: "蠣",
  蛏: "蟶",
  蛮: "蠻",
  蛰: "蟄",
  蛱: "蛺",
  蛲: "蟯",
  蛳: "螄",
  蛴: "蠐",
  蜕: "蛻",
  蜗: "蝸",
  蜡: "蠟",
  蝇: "蠅",
  蝈: "蟈",
  蝉: "蟬",
  蝼: "螻",
  蝾: "蠑",
  螀: "螿",
  螨: "蟎",
  蟏: "蠨",
  衅: "釁",
  衔: "銜",
  补: "補",
  表: "表",
  衬: "襯",
  衰: "衰",
  袄: "襖",
  袅: "裊",
  袜: "襪",
  袭: "襲",
  袯: "襏",
  装: "裝",
  裆: "襠",
  裢: "褳",
  裣: "襝",
  裤: "褲",
  裥: "襇",
  褛: "褸",
  褴: "襤",
  襁: "繈",
  见: "見",
  观: "觀",
  规: "規",
  觅: "覓",
  视: "視",
  览: "覽",
  觉: "覺",
  觊: "覬",
  觋: "覡",
  觌: "覿",
  觎: "覦",
  觏: "覯",
  觐: "覲",
  觑: "覷",
  觞: "觴",
  触: "觸",
  言: "言",
  订: "訂",
  讣: "訃",
  认: "認",
  讥: "譏",
  讦: "訐",
  讧: "訌",
  讨: "討",
  让: "讓",
  讪: "訕",
  讫: "訖",
  训: "訓",
  议: "議",
  讯: "訊",
  记: "記",
  讱: "訒",
  讲: "講",
  讳: "諱",
  讴: "謳",
  讵: "詎",
  讶: "訝",
  讷: "訥",
  许: "許",
  讹: "訛",
  论: "論",
  讼: "訟",
  讽: "諷",
  设: "設",
  访: "訪",
  诀: "訣",
  证: "證",
  诂: "詁",
  诃: "訶",
  评: "評",
  诅: "詛",
  识: "識",
  诈: "詐",
  诉: "訴",
  诊: "診",
  诋: "詆",
  诌: "謅",
  词: "詞",
  诎: "詘",
  诏: "詔",
  译: "譯",
  诒: "詒",
  诓: "誆",
  诔: "誄",
  试: "試",
  诖: "詿",
  诗: "詩",
  诘: "詰",
  诙: "詼",
  诚: "誠",
  诛: "誅",
  诜: "詵",
  话: "話",
  诞: "誕",
  诟: "詬",
  诠: "詮",
  诡: "詭",
  询: "詢",
  诣: "詣",
  诤: "諍",
  该: "該",
  详: "詳",
  诧: "詫",
  诨: "諢",
  诩: "詡",
  诫: "誡",
  诬: "誣",
  语: "語",
  诮: "誚",
  误: "誤",
  诰: "誥",
  诱: "誘",
  诲: "誨",
  诳: "誑",
  说: "說",
  诵: "誦",
  诶: "誒",
  请: "請",
  诸: "諸",
  诹: "諏",
  诺: "諾",
  读: "讀",
  诼: "諑",
  诽: "誹",
  课: "課",
  诿: "諉",
  谀: "諛",
  谁: "誰",
  谂: "諗",
  调: "調",
  谄: "諂",
  谅: "諒",
  谆: "諄",
  谇: "誶",
  谈: "談",
  谊: "誼",
  谋: "謀",
  谌: "諶",
  谍: "諜",
  谎: "謊",
  谏: "諫",
  谐: "諧",
  谑: "謔",
  谒: "謁",
  谓: "謂",
  谔: "諤",
  谕: "諭",
  谖: "諼",
  谗: "讒",
  谘: "諮",
  谙: "諳",
  谚: "諺",
  谛: "諦",
  谜: "謎",
  谝: "諞",
  谞: "諝",
  谟: "謨",
  谠: "讜",
  谡: "謖",
  谢: "謝",
  谣: "謠",
  谤: "謗",
  谥: "謚",
  谦: "謙",
  谧: "謐",
  谨: "謹",
  谩: "謾",
  谪: "謫",
  谫: "譾",
  谬: "謬",
  谭: "譚",
  谮: "譖",
  谯: "譙",
  谰: "讕",
  谱: "譜",
  谲: "譎",
  谳: "讞",
  谴: "譴",
  谵: "譫",
  谶: "讖",
  贝: "貝",
  贞: "貞",
  负: "負",
  财: "財",
  贡: "貢",
  贫: "貧",
  货: "貨",
  贩: "販",
  贪: "貪",
  贯: "貫",
  责: "責",
  贮: "貯",
  贰: "貳",
  贵: "貴",
  贬: "貶",
  买: "買",
  贷: "貸",
  费: "費",
  贴: "貼",
  贻: "貽",
  贸: "貿",
  贺: "賀",
  贲: "賁",
  贳: "貰",
  贽: "贄",
  贾: "賈",
  贿: "賄",
  赁: "賃",
  赂: "賂",
  赃: "贓",
  资: "資",
  赅: "賅",
  赈: "賑",
  赉: "賚",
  赊: "賒",
  赋: "賦",
  赌: "賭",
  赍: "齎",
  赎: "贖",
  赏: "賞",
  赐: "賜",
  赑: "贔",
  赒: "賙",
  赔: "賠",
  赖: "賴",
  赗: "賵",
  赚: "賺",
  赛: "賽",
  赜: "賾",
  赝: "贗",
  赞: "贊",
  赠: "贈",
  赡: "贍",
  赢: "贏",
  赣: "贛",
  赵: "趙",
  赶: "趕",
  趋: "趨",
  趱: "趲",
  跃: "躍",
  跄: "蹌",
  跞: "躒",
  践: "踐",
  跷: "蹺",
  跸: "蹕",
  跹: "躚",
  跻: "躋",
  踊: "踴",
  踌: "躊",
  踪: "蹤",
  踬: "躓",
  踯: "躑",
  蹑: "躡",
  蹒: "蹣",
  蹰: "躕",
  蹿: "躥",
  躏: "躪",
  躜: "躦",
  躯: "軀",
  车: "車",
  轧: "軋",
  轨: "軌",
  轩: "軒",
  轫: "軔",
  转: "轉",
  轭: "軛",
  轮: "輪",
  软: "軟",
  轰: "轟",
  轱: "軲",
  轲: "軻",
  轳: "轤",
  轴: "軸",
  轵: "軹",
  轶: "軼",
  轷: "軤",
  轸: "軫",
  轹: "轢",
  轺: "軺",
  轻: "輕",
  轼: "軾",
  载: "載",
  轾: "輊",
  轿: "轎",
  辁: "輇",
  辂: "輅",
  较: "較",
  辄: "輒",
  辅: "輔",
  辆: "輛",
  辇: "輦",
  辈: "輩",
  辉: "輝",
  辊: "輥",
  辋: "輞",
  辍: "輟",
  辎: "輜",
  辏: "輳",
  辐: "輻",
  辑: "輯",
  输: "輸",
  辔: "轡",
  辕: "轅",
  辖: "轄",
  辗: "輾",
  辘: "轆",
  辙: "轍",
  辚: "轔",
  辞: "辭",
  辩: "辯",
  辫: "辮",
  边: "邊",
  辽: "遼",
  达: "達",
  迁: "遷",
  过: "過",
  迈: "邁",
  运: "運",
  还: "還",
  这: "這",
  进: "進",
  远: "遠",
  违: "違",
  连: "連",
  迟: "遲",
  迩: "邇",
  迳: "逕",
  迹: "跡",
  适: "適",
  选: "選",
  逊: "遜",
  递: "遞",
  逻: "邏",
  遗: "遺",
  遥: "遙",
  邓: "鄧",
  邝: "鄺",
  邬: "鄔",
  邮: "郵",
  邻: "鄰",
  郁: "鬱",
  郑: "鄭",
  郓: "鄆",
  郦: "酈",
  郧: "鄖",
  郸: "鄲",
  酝: "醞",
  酦: "醱",
  酱: "醬",
  酽: "釅",
  酾: "釃",
  酿: "釀",
  释: "釋",
  里: "裡",
  针: "針",
  钉: "釘",
  钊: "釗",
  钋: "釙",
  钌: "釕",
  钍: "釷",
  钎: "釺",
  钏: "釧",
  钐: "釤",
  钑: "鈒",
  钒: "釩",
  钓: "釣",
  钔: "鍆",
  钕: "釹",
  钖: "鍚",
  钗: "釵",
  钘: "鈃",
  钙: "鈣",
  钚: "鈈",
  钛: "鈦",
  钜: "鉅",
  钝: "鈍",
  钞: "鈔",
  钟: "鐘",
  钠: "鈉",
  钡: "鋇",
  钢: "鋼",
  钣: "鈑",
  钤: "鈐",
  钥: "鑰",
  钦: "欽",
  钧: "鈞",
  钨: "鎢",
  钩: "鉤",
  钪: "鈧",
  钫: "鈁",
  钬: "鈥",
  钭: "鈄",
  钮: "鈕",
  钯: "鈀",
  钰: "鈺",
  钱: "錢",
  钲: "鉦",
  钳: "鉗",
  钴: "鈷",
  钵: "缽",
  钶: "鈳",
  钷: "鉕",
  钸: "鈽",
  钹: "鈸",
  钺: "鉞",
  钻: "鑽",
  钼: "鉬",
  钽: "鉭",
  钾: "鉀",
  钿: "鈿",
  铀: "鈾",
  铁: "鐵",
  铂: "鉑",
  铃: "鈴",
  铄: "鑠",
  铅: "鉛",
  铆: "鉚",
  铈: "鈰",
  铉: "鉉",
  铊: "鉈",
  铋: "鉍",
  铌: "鈮",
  铍: "鈹",
  铎: "鐸",
  铐: "銬",
  铑: "銠",
  铒: "鉺",
  铕: "銪",
  铖: "鋮",
  铗: "鋏",
  铘: "鋣",
  铙: "鐃",
  铛: "鐺",
  铜: "銅",
  铝: "鋁",
  铞: "銱",
  铟: "銦",
  铠: "鎧",
  铡: "鍘",
  铢: "銖",
  铣: "銑",
  铤: "鋌",
  铥: "銩",
  铧: "鏵",
  铨: "銓",
  铩: "鎩",
  铪: "鉿",
  铫: "銚",
  铬: "鉻",
  铭: "銘",
  铮: "錚",
  铯: "銫",
  铰: "鉸",
  铱: "銥",
  铲: "鏟",
  铳: "銃",
  铴: "鐋",
  铵: "銨",
  银: "銀",
  铷: "銣",
  铸: "鑄",
  铹: "鐒",
  铺: "鋪",
  铻: "鋙",
  铼: "錸",
  铽: "鋱",
  链: "鏈",
  铿: "鏗",
  销: "銷",
  锁: "鎖",
  锂: "鋰",
  锃: "鋥",
  锄: "鋤",
  锅: "鍋",
  锆: "鋯",
  锇: "鋨",
  锈: "鏽",
  锉: "銼",
  锊: "鋝",
  锋: "鋒",
  锌: "鋅",
  锍: "鋶",
  锎: "鐦",
  锏: "鐧",
  锐: "銳",
  锑: "銻",
  锒: "鋃",
  锓: "鋟",
  锔: "鋦",
  锕: "錒",
  锖: "錆",
  锗: "鍺",
  锘: "鍩",
  错: "錯",
  锚: "錨",
  锛: "錛",
  锜: "錡",
  锝: "鍀",
  锞: "錁",
  锟: "錕",
  锡: "錫",
  锢: "錮",
  锣: "鑼",
  锤: "錘",
  锥: "錐",
  锦: "錦",
  锧: "鑕",
  锨: "鍁",
  锩: "錈",
  锪: "鍃",
  锫: "錇",
  锬: "錟",
  锭: "錠",
  键: "鍵",
  锯: "鋸",
  锰: "錳",
  锱: "錙",
  锲: "鍥",
  锳: "鍈",
  锴: "鍇",
  锵: "鏘",
  锶: "鍶",
  锷: "鍔",
  锸: "鍤",
  锹: "鍬",
  锺: "鍾",
  锻: "鍛",
  锼: "鎪",
  锽: "鍠",
  锾: "鍰",
  锿: "鎄",
  镀: "鍍",
  镁: "鎂",
  镂: "鏤",
  镃: "鎡",
  镄: "鐨",
  镅: "鎇",
  镆: "鏌",
  镇: "鎮",
  镈: "鎛",
  镉: "鎘",
  镊: "鑷",
  镋: "钂",
  镌: "鐫",
  镍: "鎳",
  镎: "鎿",
  镏: "鎦",
  镐: "鎬",
  镑: "鎊",
  镒: "鎰",
  镓: "鎵",
  镔: "鑌",
  镕: "鎔",
  镖: "鏢",
  镗: "鏜",
  镘: "鏝",
  镙: "鏍",
  镚: "鏰",
  镛: "鏞",
  镜: "鏡",
  镝: "鏑",
  镞: "鏃",
  镟: "鏇",
  镠: "鏐",
  镡: "鐔",
  镢: "钁",
  镣: "鐐",
  镤: "鏷",
  镥: "鑥",
  镦: "鐓",
  镧: "鑭",
  镨: "鐠",
  镩: "鑹",
  镪: "鏹",
  镫: "鐙",
  镬: "鑊",
  镭: "鐳",
  镮: "鐶",
  镯: "鐲",
  镰: "鐮",
  镱: "鐿",
  镲: "鑔",
  镳: "鑣",
  镴: "鑞",
  门: "門",
  闩: "閂",
  闪: "閃",
  闫: "閆",
  闭: "閉",
  问: "問",
  闯: "闖",
  闰: "閏",
  闱: "闈",
  闲: "閒",
  闳: "閎",
  间: "間",
  闵: "閔",
  闶: "閌",
  闷: "悶",
  闸: "閘",
  闹: "鬧",
  闺: "閨",
  闻: "聞",
  闼: "闥",
  闽: "閩",
  闾: "閭",
  闿: "闓",
  阀: "閥",
  阁: "閣",
  阂: "閡",
  阃: "閫",
  阄: "鬮",
  阅: "閱",
  阆: "閬",
  阇: "闍",
  阈: "閾",
  阉: "閹",
  阊: "閶",
  阋: "鬩",
  阌: "閿",
  阍: "閽",
  阎: "閻",
  阏: "閼",
  阐: "闡",
  阑: "闌",
  阒: "闃",
  阔: "闊",
  阕: "闋",
  阖: "闔",
  阗: "闐",
  阘: "闒",
  阙: "闕",
  阚: "闞",
  队: "隊",
  阳: "陽",
  阴: "陰",
  阵: "陣",
  阶: "階",
  际: "際",
  陆: "陸",
  陇: "隴",
  陈: "陳",
  陉: "陘",
  陕: "陝",
  陧: "隉",
  陨: "隕",
  险: "險",
  随: "隨",
  隐: "隱",
  隶: "隸",
  难: "難",
  雏: "雛",
  雠: "讎",
  雳: "靂",
  雾: "霧",
  霁: "霽",
  霉: "黴",
  霭: "靄",
  靓: "靚",
  静: "靜",
  靥: "靨",
  鞑: "韃",
  鞒: "鞽",
  鞯: "韉",
  韦: "韋",
  韧: "韌",
  韩: "韓",
  韪: "韙",
  韫: "韞",
  韬: "韜",
  页: "頁",
  顶: "頂",
  顷: "頃",
  项: "項",
  顺: "順",
  须: "須",
  顼: "頊",
  顽: "頑",
  顾: "顧",
  顿: "頓",
  颀: "頎",
  颁: "頒",
  颂: "頌",
  颃: "頏",
  预: "預",
  颅: "顱",
  领: "領",
  颇: "頗",
  颈: "頸",
  颉: "頡",
  颊: "頰",
  颌: "頜",
  颍: "潁",
  颎: "熲",
  颏: "頦",
  颐: "頤",
  频: "頻",
  颓: "頹",
  颔: "頷",
  颖: "穎",
  颗: "顆",
  题: "題",
  颚: "顎",
  颛: "顓",
  颜: "顏",
  额: "額",
  颞: "顳",
  颟: "顢",
  颠: "顛",
  颡: "顙",
  颢: "顥",
  颤: "顫",
  颥: "顬",
  颦: "顰",
  风: "風",
  飐: "颭",
  飒: "颯",
  飓: "颶",
  飔: "颸",
  飕: "颼",
  飖: "颻",
  飘: "飄",
  飙: "飆",
  飚: "飈",
  飞: "飛",
  食: "食",
  飨: "饗",
  餍: "饜",
  餐: "餐",
  饥: "飢",
  饧: "餳",
  饨: "飩",
  饩: "餼",
  饪: "飪",
  饫: "飫",
  饬: "飭",
  饭: "飯",
  饮: "飲",
  饯: "餞",
  饰: "飾",
  饱: "飽",
  饲: "飼",
  饳: "飿",
  饴: "飴",
  饵: "餌",
  饶: "饒",
  饷: "餉",
  饸: "餄",
  饹: "餎",
  饺: "餃",
  饻: "餏",
  饼: "餅",
  饽: "餑",
  饾: "餖",
  饿: "餓",
  馀: "餘",
  馁: "餒",
  馂: "餕",
  馃: "餜",
  馄: "餛",
  馅: "餡",
  馆: "館",
  馇: "餷",
  馈: "饋",
  馉: "餶",
  馊: "餿",
  馋: "饞",
  馌: "饁",
  馍: "饃",
  馎: "餺",
  馏: "餾",
  馐: "饈",
  馑: "饉",
  馒: "饅",
  馓: "饊",
  馔: "饌",
  馕: "饢",
  马: "馬",
  驭: "馭",
  驮: "馱",
  驯: "馴",
  驰: "馳",
  驱: "驅",
  驲: "馹",
  驳: "駁",
  驴: "驢",
  驵: "駔",
  驶: "駛",
  驷: "駟",
  驸: "駙",
  驹: "駒",
  驺: "騶",
  驻: "駐",
  驼: "駝",
  驽: "駑",
  驾: "駕",
  驿: "驛",
  骀: "駘",
  骁: "驍",
  骂: "罵",
  骄: "驕",
  骅: "驊",
  骆: "駱",
  骇: "駭",
  骈: "駢",
  骊: "驪",
  骋: "騁",
  验: "驗",
  骎: "駸",
  骏: "駿",
  骐: "騏",
  骑: "騎",
  骒: "騍",
  骓: "騅",
  骖: "驂",
  骗: "騙",
  骘: "騭",
  骚: "騷",
  骛: "騖",
  骜: "驁",
  骝: "騮",
  骞: "騫",
  骟: "騸",
  骠: "驃",
  骡: "騾",
  骢: "驄",
  骣: "驏",
  骤: "驟",
  骥: "驥",
  骧: "驤",
  髅: "髏",
  髋: "髖",
  髌: "髕",
  鬓: "鬢",
  魇: "魘",
  鱼: "魚",
  鱿: "魷",
  鲁: "魯",
  鲂: "魴",
  鲅: "鮁",
  鲆: "鮃",
  鲇: "鯰",
  鲈: "鱸",
  鲋: "鮒",
  鲍: "鮑",
  鲎: "鱟",
  鲐: "鮐",
  鲑: "鮭",
  鲒: "鮚",
  鲔: "鮪",
  鲕: "鮞",
  鲚: "鱭",
  鲛: "鮫",
  鲜: "鮮",
  鲞: "鯗",
  鲟: "鱘",
  鲠: "鯁",
  鲡: "鱺",
  鲢: "鰱",
  鲣: "鰹",
  鲤: "鯉",
  鲥: "鰣",
  鲦: "鰷",
  鲧: "鯀",
  鲨: "鯊",
  鲩: "鯇",
  鲫: "鯽",
  鲭: "鯖",
  鲮: "鯪",
  鲰: "鯫",
  鲱: "鯡",
  鲲: "鯤",
  鲳: "鯧",
  鲴: "鯝",
  鲵: "鯢",
  鲶: "鯰",
  鲷: "鯛",
  鲸: "鯨",
  鲺: "鯴",
  鲻: "鯔",
  鲼: "鱝",
  鲽: "鰈",
  鲾: "鰏",
  鳃: "鰓",
  鳄: "鱷",
  鳅: "鰍",
  鳆: "鰒",
  鳇: "鰉",
  鳌: "鰲",
  鳍: "鰭",
  鳎: "鰨",
  鳏: "鰥",
  鳐: "鰩",
  鳓: "鰳",
  鳔: "鰾",
  鳕: "鱈",
  鳖: "鱉",
  鳗: "鰻",
  鳘: "鰵",
  鳙: "鱅",
  鳜: "鱖",
  鳝: "鱔",
  鳞: "鱗",
  鳟: "鱒",
  鸟: "鳥",
  鸠: "鳩",
  鸡: "雞",
  鸢: "鳶",
  鸣: "鳴",
  鸥: "鷗",
  鸦: "鴉",
  鸧: "鶬",
  鸨: "鴇",
  鸩: "鴆",
  鸪: "鴣",
  鸫: "鶇",
  鸬: "鸕",
  鸭: "鴨",
  鸮: "鴞",
  鸯: "鴦",
  鸰: "鴒",
  鸱: "鴟",
  鸲: "鴝",
  鸳: "鴛",
  鸵: "鴕",
  鸶: "鷥",
  鸷: "鷙",
  鸸: "鴯",
  鸹: "鴰",
  鸺: "鵂",
  鸻: "鴴",
  鸼: "鵃",
  鸽: "鴿",
  鸾: "鸞",
  鸿: "鴻",
  鹁: "鵓",
  鹂: "鸝",
  鹃: "鵑",
  鹄: "鵠",
  鹅: "鵝",
  鹆: "鵒",
  鹇: "鷳",
  鹈: "鵜",
  鹉: "鵡",
  鹊: "鵲",
  鹋: "鶓",
  鹌: "鵪",
  鹎: "鵯",
  鹏: "鵬",
  鹑: "鶉",
  鹒: "鶊",
  鹓: "鵷",
  鹔: "鷫",
  鹕: "鶘",
  鹖: "鶡",
  鹗: "鶚",
  鹘: "鶻",
  鹚: "鷀",
  鹛: "鶥",
  鹜: "鶩",
  鹞: "鷂",
  鹟: "鶲",
  鹠: "鶹",
  鹡: "鶺",
  鹢: "鷁",
  鹣: "鶼",
  鹤: "鶴",
  鹥: "鷖",
  鹦: "鸚",
  鹧: "鷓",
  鹨: "鷚",
  鹩: "鷯",
  鹪: "鷦",
  鹫: "鷲",
  鹬: "鷸",
  鹭: "鷺",
  鹯: "鸇",
  鹰: "鷹",
  鹱: "鸌",
  鹲: "鸏",
  鹳: "鸛",
  鹴: "鸘",
  麦: "麥",
  麸: "麩",
  黄: "黃",
  黉: "黌",
  点: "點",
  齐: "齊",
  齑: "齏",
  齿: "齒",
  龄: "齡",
  龃: "齟",
  龄: "齡",
  龅: "齙",
  龆: "齠",
  龇: "齜",
  龈: "齦",
  龉: "齬",
  龊: "齪",
  龋: "齲",
  龌: "齷",
  龙: "龍",
  龚: "龔",
  龛: "龕",
};

const SORT_OPTIONS = {
  cases: [
    ["quality-desc", "sortQualityDesc"],
    ["date-desc", "sortDateDesc"],
    ["date-asc", "sortDateAsc"],
    ["title-asc", "sortTitleAsc"],
    ["region-asc", "sortRegionAsc"],
  ],
  resources: [
    ["quality-desc", "sortQualityDesc"],
    ["title-asc", "sortTitleAsc"],
    ["region-asc", "sortRegionAsc"],
    ["date-desc", "sortDateDesc"],
    ["date-asc", "sortDateAsc"],
    ["publisher-asc", "sortPublisherAsc"],
  ],
  prompts: [
    ["quality-desc", "sortQualityDesc"],
    ["subject-asc", "sortSubjectAsc"],
    ["type-asc", "sortTypeAsc"],
    ["title-asc", "sortTitleAsc"],
  ],
};

const FAVORITES_KEY = "aied-case-hub-favorites-v1";

const TASK_LABELS = [
  "备课设计",
  "课堂活动",
  "学习单/教材",
  "评价反馈",
  "AI素养",
  "项目学习",
  "语言学习",
  "STEM探究",
  "艺术创作",
  "资源规划",
  "行政与教学管理",
  "研究与政策",
  "家校沟通",
  "学生支持",
];

const TASK_RULES = [
  ["备课设计", ["备课", "教案", "课时", "lesson plan", "unit design", "planning"]],
  ["课堂活动", ["课堂", "活动", "讨论", "classroom", "activity", "workshop", "lesson"]],
  ["学习单/教材", ["学习单", "教材", "材料", "worksheet", "material", "curriculum", "resource book"]],
  ["评价反馈", ["评价", "评估", "反馈", "rubric", "assessment", "feedback", "批改"]],
  ["AI素养", ["ai literacy", "素养", "伦理", "responsible", "competency", "framework", "安全"]],
  ["项目学习", ["项目", "project", "challenge", "pbl", "探究"]],
  ["语言学习", ["英文", "中文", "language", "writing", "reading", "listening", "speaking", "作文", "阅读"]],
  ["STEM探究", ["stem", "steam", "science", "math", "coding", "编程", "数学", "科学", "机器人"]],
  ["艺术创作", ["arts", "art", "design", "visual", "music", "image", "艺术", "设计", "创作"]],
  ["资源规划", ["资源", "指南", "课程", "目录", "toolkit", "guide", "policy", "framework"]],
  ["行政与教学管理", ["管理", "行政", "教师培训", "professional development", "school leader"]],
  ["研究与政策", ["研究", "报告", "论文", "policy", "research", "report", "unesco"]],
  ["家校沟通", ["家校", "家长", "parent", "沟通"]],
  ["学生支持", ["学生支持", "分层", "差异化", "tutoring", "support", "scaffold"]],
];

const PROMPT_SHORTCUTS = [
  { label: "生成学习单", promptType: "教材生成", task: "学习单/教材" },
  { label: "设计课堂活动", promptType: "课堂活动", task: "课堂活动" },
  { label: "制作评价量规", promptType: "评价反馈", task: "评价反馈" },
  { label: "改写分层材料", promptType: "差异化支持", task: "学生支持" },
  { label: "设计AI素养课", category: "AI Literacy", subject: "AI素养" },
  { label: "做项目学习", promptType: "项目学习", task: "项目学习" },
  { label: "支持个别学生", promptType: "学生支持", task: "学生支持" },
  { label: "写家校沟通", promptType: "家校沟通", task: "家校沟通" },
  { label: "找教学案例", view: "cases" },
  { label: "找教材资源", view: "resources" },
];

const TOOL_TASK_OPTIONS = [
  "备课设计",
  "课堂活动",
  "学习单/教材",
  "评价反馈",
  "差异化支持",
  "项目学习",
  "AI素养",
  "家校沟通",
  "学生支持",
];

const TOOL_LANGUAGE_OPTIONS = ["中文", "英文", "双语"];
const AGREEMENT_ALLOWED_OPTIONS = ["保守使用", "开放使用"];
const AGREEMENT_ASSESSMENT_OPTIONS = ["只作过程支持", "可计入过程证据", "不计入成绩"];
const AGREEMENT_PRIVACY_OPTIONS = ["不输入个人资料", "只输入匿名资料", "可输入课堂材料"];
const SPECIAL_TOOL_OPTIONS = ["评价量规", "分层改写", "反馈语", "家校沟通", "课堂提问", "退出卡/小测"];

const viewState = {
  active: "cases",
};

const languageState = {
  current: initialLanguage(),
};

const caseState = {
  items: [],
  category: "全部",
  subcategory: "全部",
  task: "全部",
  search: "",
  level: "全部",
  language: "全部",
  region: "全部",
  source: "全部",
  method: "全部",
  quality: "全部",
  linkStatus: "全部",
  favoritesOnly: false,
  sort: "quality-desc",
  page: 1,
};

const candidateState = {
  items: [],
  previewOpen: false,
};

const resourceState = {
  items: [],
  search: "",
  region: "全部",
  task: "全部",
  level: "全部",
  audience: "全部",
  resourceType: "全部",
  category: "全部",
  language: "全部",
  accessType: "全部",
  quality: "全部",
  linkStatus: "全部",
  favoritesOnly: false,
  sort: "quality-desc",
  page: 1,
};

const promptState = {
  items: [],
  search: "",
  subject: "全部",
  task: "全部",
  level: "全部",
  promptType: "全部",
  skillDomain: "全部",
  evidenceStrength: "全部",
  category: "全部",
  audience: "全部",
  outputFormat: "全部",
  quality: "全部",
  linkStatus: "全部",
  favoritesOnly: false,
  sort: "quality-desc",
  page: 1,
};

const pathState = {
  items: [],
};

const caseDetailState = {
  activeId: "",
};

const favoriteState = {
  keys: readFavoriteKeys(),
};

const assistantState = {
  studioUrl: "",
  hasConfigError: false,
  frameLoaded: false,
};

const viewElements = {
  tabs: [...document.querySelectorAll("[data-view]")],
  panels: [...document.querySelectorAll("[data-view-panel]")],
  languageSelect: document.querySelector("#languageSelect"),
  caseTabCount: document.querySelector("#caseTabCount"),
  resourceTabCount: document.querySelector("#resourceTabCount"),
  promptTabCount: document.querySelector("#promptTabCount"),
  assistantTabStatus: document.querySelector("#assistantTabStatus"),
};

const caseEls = {
  listBlocks: [...document.querySelectorAll("[data-case-list-block]")],
  detail: document.querySelector("#caseDetail"),
  tabs: document.querySelector("#categoryTabs"),
  cards: document.querySelector("#cases"),
  empty: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  subcategory: document.querySelector("#subcategoryFilter"),
  task: document.querySelector("#caseTaskFilter"),
  level: document.querySelector("#levelFilter"),
  language: document.querySelector("#languageFilter"),
  region: document.querySelector("#regionFilter"),
  source: document.querySelector("#sourceFilter"),
  method: document.querySelector("#methodFilter"),
  quality: document.querySelector("#caseQualityFilter"),
  linkStatus: document.querySelector("#caseLinkFilter"),
  favoritesOnly: document.querySelector("#favoriteCasesOnly"),
  sort: document.querySelector("#sortSelect"),
  reset: document.querySelector("#resetFilters"),
  total: document.querySelector("#totalCases"),
  hongKong: document.querySelector("#hongKongCases"),
  categoryCount: document.querySelector("#categoryCount"),
  lastAccessed: document.querySelector("#lastAccessed"),
  resultsTitle: document.querySelector("#resultsTitle"),
  resultsMeta: document.querySelector("#resultsMeta"),
  pagination: document.querySelector("#casePagination"),
};

const candidateEls = {
  notice: document.querySelector("#candidateNotice"),
  countLabel: document.querySelector("#candidateCountLabel"),
  note: document.querySelector("#candidateNote"),
  toggle: document.querySelector("#candidatePreviewToggle"),
  preview: document.querySelector("#candidatePreview"),
};

const resourceEls = {
  cards: document.querySelector("#resources"),
  empty: document.querySelector("#resourceEmptyState"),
  search: document.querySelector("#resourceSearchInput"),
  region: document.querySelector("#resourceRegionFilter"),
  task: document.querySelector("#resourceTaskFilter"),
  level: document.querySelector("#resourceLevelFilter"),
  audience: document.querySelector("#resourceAudienceFilter"),
  resourceType: document.querySelector("#resourceTypeFilter"),
  category: document.querySelector("#resourceCategoryFilter"),
  language: document.querySelector("#resourceLanguageFilter"),
  accessType: document.querySelector("#resourceAccessFilter"),
  quality: document.querySelector("#resourceQualityFilter"),
  linkStatus: document.querySelector("#resourceLinkFilter"),
  favoritesOnly: document.querySelector("#favoriteResourcesOnly"),
  sort: document.querySelector("#resourceSortSelect"),
  reset: document.querySelector("#resourceResetFilters"),
  total: document.querySelector("#totalResources"),
  regionCount: document.querySelector("#regionCount"),
  resourceTypeCount: document.querySelector("#resourceTypeCount"),
  lastAccessed: document.querySelector("#resourceLastAccessed"),
  resultsTitle: document.querySelector("#resourceResultsTitle"),
  resultsMeta: document.querySelector("#resourceResultsMeta"),
  pagination: document.querySelector("#resourcePagination"),
};

const promptEls = {
  cards: document.querySelector("#prompts"),
  empty: document.querySelector("#promptEmptyState"),
  shortcuts: document.querySelector("#promptTaskShortcuts"),
  search: document.querySelector("#promptSearchInput"),
  subject: document.querySelector("#promptSubjectFilter"),
  task: document.querySelector("#promptTaskFilter"),
  level: document.querySelector("#promptLevelFilter"),
  promptType: document.querySelector("#promptTypeFilter"),
  skillDomain: document.querySelector("#promptDomainFilter"),
  evidenceStrength: document.querySelector("#promptEvidenceFilter"),
  category: document.querySelector("#promptCategoryFilter"),
  audience: document.querySelector("#promptAudienceFilter"),
  outputFormat: document.querySelector("#promptOutputFilter"),
  quality: document.querySelector("#promptQualityFilter"),
  linkStatus: document.querySelector("#promptLinkFilter"),
  favoritesOnly: document.querySelector("#favoritePromptsOnly"),
  sort: document.querySelector("#promptSortSelect"),
  reset: document.querySelector("#promptResetFilters"),
  total: document.querySelector("#totalPrompts"),
  subjectCount: document.querySelector("#promptSubjectCount"),
  promptTypeCount: document.querySelector("#promptTypeCount"),
  lastAccessed: document.querySelector("#promptLastAccessed"),
  resultsTitle: document.querySelector("#promptResultsTitle"),
  resultsMeta: document.querySelector("#promptResultsMeta"),
  pagination: document.querySelector("#promptPagination"),
};

const pathEls = {
  section: document.querySelector("#learningPathSection"),
  grid: document.querySelector("#learningPaths"),
};

const assistantEls = {
  frameWrap: document.querySelector("#assistantFrameWrap"),
  frame: document.querySelector("#assistantFrame"),
  empty: document.querySelector("#assistantEmptyState"),
  emptyTitle: document.querySelector("#assistantEmptyTitle"),
  emptyCopy: document.querySelector("#assistantEmptyCopy"),
  directLink: document.querySelector("#assistantDirectLink"),
};

const toolkitEls = {
  task: document.querySelector("#toolTask"),
  subject: document.querySelector("#toolSubject"),
  level: document.querySelector("#toolLevel"),
  topic: document.querySelector("#toolTopic"),
  duration: document.querySelector("#toolDuration"),
  language: document.querySelector("#toolLanguage"),
  aiTool: document.querySelector("#toolAiTool"),
  needs: document.querySelector("#toolStudentNeeds"),
  generatePrompt: document.querySelector("#toolGeneratePrompt"),
  copyPrompt: document.querySelector("#toolCopyPrompt"),
  promptOutput: document.querySelector("#toolPromptOutput"),
  savedCasesCount: document.querySelector("#savedCasesCount"),
  savedResourcesCount: document.querySelector("#savedResourcesCount"),
  savedPromptsCount: document.querySelector("#savedPromptsCount"),
  exportSaved: document.querySelector("#toolExportSaved"),
  copySaved: document.querySelector("#toolCopySaved"),
  savedOutput: document.querySelector("#savedPackOutput"),
  agreementLevel: document.querySelector("#agreementLevel"),
  agreementAllowed: document.querySelector("#agreementAllowed"),
  agreementAssessment: document.querySelector("#agreementAssessment"),
  agreementPrivacy: document.querySelector("#agreementPrivacy"),
  generateAgreement: document.querySelector("#toolGenerateAgreement"),
  copyAgreement: document.querySelector("#toolCopyAgreement"),
  agreementOutput: document.querySelector("#agreementOutput"),
  specialType: document.querySelector("#specialToolType"),
  specialSubject: document.querySelector("#specialSubject"),
  specialLevel: document.querySelector("#specialLevel"),
  specialGoal: document.querySelector("#specialGoal"),
  specialMaterial: document.querySelector("#specialMaterial"),
  specialConstraints: document.querySelector("#specialConstraints"),
  generateSpecial: document.querySelector("#toolGenerateSpecial"),
  copySpecial: document.querySelector("#toolCopySpecial"),
  specialOutput: document.querySelector("#specialOutput"),
};

function initialLanguage() {
  const urlLanguage = new URLSearchParams(window.location.search).get("lang");
  const savedLanguage = localStorage.getItem("aied-language");
  if (SUPPORTED_LANGUAGES.includes(urlLanguage)) return urlLanguage;
  if (SUPPORTED_LANGUAGES.includes(savedLanguage)) return savedLanguage;
  return "zh-Hans";
}

function t(key, values = {}) {
  const source =
    TEXT[languageState.current]?.[key] ??
    TEXT["zh-Hans"][key] ??
    key;
  const localized = languageState.current === "zh-Hant" ? toTraditional(source) : source;
  return localized.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}

function toTraditional(value) {
  let text = String(value ?? "");
  TRADITIONAL_PHRASES.forEach(([from, to]) => {
    text = text.replaceAll(from, to);
  });
  return [...text].map((char) => TRADITIONAL_CHARS[char] || char).join("");
}

function localizeText(value) {
  if (!value) return "";
  if (languageState.current === "zh-Hant") return toTraditional(value);
  return value;
}

function localizeValue(value) {
  if (!value) return "";
  if (languageState.current === "en" && VALUE_EN[value]) return VALUE_EN[value];
  return localizeText(value);
}

function localizeTitle(item, titleKey = "title_cn") {
  if (languageState.current === "en" && item.title_original) return item.title_original;
  return localizeText(item[titleKey] || item.title_original || "");
}

function localizeSecondaryTitle(item, titleKey = "title_cn") {
  if (languageState.current === "en") {
    return localizeText(item[titleKey] || item.subject || item.title_original || "");
  }
  return localizeText(
    item.title_original && item.title_original !== item[titleKey] ? item.title_original : item.subject
  );
}

function updateLanguageOptions() {
  viewElements.languageSelect.querySelectorAll("option").forEach((option) => {
    option.textContent = LANGUAGE_LABELS[option.value] || option.textContent;
  });
}

function applyStaticTranslations() {
  document.documentElement.lang = LANGUAGE_META[languageState.current].htmlLang;
  document.title = t("documentTitle");
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", t("documentDescription"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
}

function setSortOptions(select, options, selectedValue) {
  select.innerHTML = "";
  options.forEach(([value, labelKey]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = t(labelKey);
    select.append(option);
  });
  select.value = selectedValue;
}

function renderSortOptions() {
  setSortOptions(caseEls.sort, SORT_OPTIONS.cases, caseState.sort);
  setSortOptions(resourceEls.sort, SORT_OPTIONS.resources, resourceState.sort);
  setSortOptions(promptEls.sort, SORT_OPTIONS.prompts, promptState.sort);
}

function renderToolkitOptions() {
  fillOptions(toolkitEls.task, TOOL_TASK_OPTIONS);
  fillOptions(toolkitEls.language, TOOL_LANGUAGE_OPTIONS);
  fillOptions(toolkitEls.agreementAllowed, AGREEMENT_ALLOWED_OPTIONS);
  fillOptions(toolkitEls.agreementAssessment, AGREEMENT_ASSESSMENT_OPTIONS);
  fillOptions(toolkitEls.agreementPrivacy, AGREEMENT_PRIVACY_OPTIONS);
  fillOptions(toolkitEls.specialType, SPECIAL_TOOL_OPTIONS);
}

function refreshLanguage() {
  updateLanguageOptions();
  applyStaticTranslations();
  renderSortOptions();
  renderToolkitOptions();
  renderPromptShortcuts();
  renderToolkitSavedCounts();
  renderTeacherPrompt();
  renderSavedPack();
  renderAgreement();
  renderSpecialistPrompt();
  renderCandidateNotice();
  renderLearningPaths();
  if (caseState.items.length > 0) {
    populateCaseControls();
    renderCaseStats();
    renderCases();
  }
  if (resourceState.items.length > 0) {
    populateResourceControls();
    renderResourceStats();
    renderResources();
  }
  if (promptState.items.length > 0) {
    populatePromptControls();
    renderPromptStats();
    renderPrompts();
  }
  renderAssistant(assistantState.studioUrl);
}

function setupLanguageControl() {
  viewElements.languageSelect.value = languageState.current;
  updateLanguageOptions();
  viewElements.languageSelect.addEventListener("change", (event) => {
    languageState.current = event.target.value;
    localStorage.setItem("aied-language", languageState.current);
    refreshLanguage();
  });
}

function readFavoriteKeys() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function saveFavoriteKeys() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteState.keys].sort()));
}

function favoriteKey(type, item) {
  return `${type}:${item.id}`;
}

function isFavorite(type, item) {
  return favoriteState.keys.has(favoriteKey(type, item));
}

function toggleFavorite(type, item) {
  const key = favoriteKey(type, item);
  if (favoriteState.keys.has(key)) {
    favoriteState.keys.delete(key);
  } else {
    favoriteState.keys.add(key);
  }
  saveFavoriteKeys();

  if (type === "case") {
    renderCases();
  } else if (type === "resource") {
    renderResources();
  } else if (type === "prompt") {
    renderPrompts();
  }
  renderToolkitSavedCounts();
}

function createFavoriteButton(type, item) {
  const button = document.createElement("button");
  button.className = `favorite-button ${isFavorite(type, item) ? "is-saved" : ""}`.trim();
  button.type = "button";
  button.setAttribute("aria-pressed", isFavorite(type, item) ? "true" : "false");
  button.textContent = isFavorite(type, item) ? t("removeFavorite") : t("addFavorite");
  button.addEventListener("click", () => toggleFavorite(type, item));
  return button;
}

function itemText(item) {
  return Object.values(item).join(" ").toLowerCase();
}

function tasksForItem(type, item) {
  const text = itemText(item);
  const tasks = new Set();

  TASK_RULES.forEach(([label, keywords]) => {
    if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
      tasks.add(label);
    }
  });

  if (type === "case") {
    if (item.category === "AI Literacy") tasks.add("AI素养");
    if (item.category === "AI+STEM") tasks.add("STEM探究");
    if (item.category === "AI+Humanities") tasks.add("语言学习");
    if (item.category === "AI+Social Sciences") tasks.add("研究与政策");
    if (item.category === "AI for Teaching & Assessment") tasks.add("备课设计");
    tasks.add("课堂活动");
  }

  if (type === "resource") {
    if (item.resource_type === "政策框架" || item.resource_type === "研究报告") tasks.add("研究与政策");
    if (item.resource_type === "教师指南" || item.resource_type === "资源目录") tasks.add("资源规划");
    if (item.resource_type === "课堂工具包" || item.resource_type === "课程/教材") tasks.add("学习单/教材");
  }

  if (type === "prompt") {
    if (TASK_LABELS.includes(item.prompt_type)) tasks.add(item.prompt_type);
    if (item.prompt_type === "教材生成") tasks.add("学习单/教材");
  }

  if (tasks.size === 0) {
    tasks.add(type === "resource" ? "资源规划" : "备课设计");
  }

  return [...tasks].filter((task) => TASK_LABELS.includes(task));
}

function uniqueTaskValues(items, type) {
  return [...new Set(items.flatMap((item) => tasksForItem(type, item)))].sort((a, b) =>
    localizeValue(a).localeCompare(localizeValue(b), LANGUAGE_META[languageState.current].locale)
  );
}

function matchesTask(type, item, selected) {
  return selected === "全部" || tasksForItem(type, item).includes(selected);
}

function matchesFavorite(type, item, onlyFavorites) {
  return !onlyFavorites || isFavorite(type, item);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift().map((header) => header.trim());
  return rows.map((values) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (values[index] || "").trim();
    });
    return item;
  });
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((a, b) =>
    localizeValue(a).localeCompare(localizeValue(b), LANGUAGE_META[languageState.current].locale)
  );
}

function fillSelect(select, values) {
  const currentValue = select.value;
  select.innerHTML = "";
  ["全部", ...values].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = localizeValue(value);
    select.append(option);
  });
  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function fillOptions(select, values) {
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = localizeValue(value);
    select.append(option);
  });
  select.value = values.includes(currentValue) ? currentValue : values[0];
}

function dateValue(value) {
  if (!value) return 0;
  const normalized = value.length === 4 ? `${value}-01-01` : value;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function matchesField(value, selected) {
  return selected === "全部" || value === selected;
}

function createTag(text, extraClass = "") {
  const tag = document.createElement("span");
  tag.className = `tag ${extraClass}`.trim();
  tag.textContent = localizeValue(text);
  return tag;
}

function createQualityTag(item) {
  const label = item.quality_label || "资料不完整";
  const className = label === "高质量" ? "quality-high" : label === "资料完整" ? "quality-complete" : "quality-basic";
  return createTag(`${localizeValue(label)} · ${item.quality_score || 0}`, className);
}

function linkStatusLabel(status) {
  return localizeValue(status || "unverified");
}

function createLinkStatusTag(item) {
  const status = item.link_status || "unverified";
  return createTag(linkStatusLabel(status), `link-${status}`);
}

function createCollectionTag(item) {
  return /^自动收录[:：]/.test(item.summary_cn || "") ? createTag(t("autoCollected"), "auto-collected") : null;
}

function verifiedDate(item) {
  return item.last_verified_date || t("notMarked");
}

function createMeta(label, value) {
  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value ? localizeValue(value) : t("notMarked");
  wrapper.append(term, description);
  return wrapper;
}

function createCopyButton(text, label) {
  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = t("copied");
    } catch {
      button.textContent = t("copyFailed");
    }
    window.setTimeout(() => {
      button.textContent = label;
    }, 1600);
  });
  return button;
}

function renderPagination(totalItems, state, elements, render, target) {
  elements.pagination.innerHTML = "";
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  elements.pagination.hidden = totalItems <= PAGE_SIZE;
  if (totalItems <= PAGE_SIZE) return;

  const previous = document.createElement("button");
  previous.className = "page-button";
  previous.type = "button";
  previous.textContent = t("previousPage");
  previous.disabled = state.page === 1;
  previous.addEventListener("click", () => {
    state.page -= 1;
    render();
    target.scrollIntoView({ block: "start", behavior: "smooth" });
  });

  const status = document.createElement("span");
  status.className = "page-status";
  status.textContent = t("pageStatus", { page: state.page, totalPages });

  const next = document.createElement("button");
  next.className = "page-button";
  next.type = "button";
  next.textContent = t("nextPage");
  next.disabled = state.page === totalPages;
  next.addEventListener("click", () => {
    state.page += 1;
    render();
    target.scrollIntoView({ block: "start", behavior: "smooth" });
  });

  elements.pagination.append(previous, status, next);
}

function pageSlice(items, state) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    first: items.length === 0 ? 0 : start + 1,
    last: Math.min(start + PAGE_SIZE, items.length),
  };
}

function setActiveView(view, updateHash = true) {
  const nextView = VIEWS.includes(view) ? view : "cases";
  viewState.active = nextView;
  viewElements.tabs.forEach((tab) => {
    const active = tab.dataset.view === nextView;
    if (active) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
  viewElements.panels.forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== nextView;
  });
  if (nextView === "assistant") {
    mountAssistantFrame();
  }
  if (updateHash && window.location.hash !== `#${nextView}`) {
    history.replaceState(null, "", `#${nextView}`);
  }
}

function showAssistantEmpty(title, copy) {
  assistantEls.frameWrap.hidden = true;
  assistantEls.frame.removeAttribute("src");
  assistantState.frameLoaded = false;
  assistantEls.empty.hidden = false;
  assistantEls.emptyTitle.textContent = title;
  assistantEls.emptyCopy.textContent = copy;
  assistantEls.directLink.hidden = true;
  viewElements.assistantTabStatus.textContent = t("assistantStatusPending");
}

function renderAssistant(studioUrl) {
  if (assistantState.hasConfigError) {
    showAssistantEmpty(t("assistantLoadErrorTitle"), t("assistantLoadErrorCopy", { url: RAG_CONFIG_URL }));
    return;
  }

  const url = (studioUrl || "").trim();
  if (!url) {
    showAssistantEmpty(t("assistantEmptyTitle"), t("assistantEmptyCopy"));
    return;
  }

  assistantState.studioUrl = url;
  if (viewState.active === "assistant") {
    mountAssistantFrame();
  } else {
    assistantEls.frameWrap.hidden = true;
    assistantEls.frame.removeAttribute("src");
    assistantState.frameLoaded = false;
  }
  assistantEls.empty.hidden = true;
  assistantEls.directLink.href = url;
  assistantEls.directLink.hidden = false;
  viewElements.assistantTabStatus.textContent = t("assistantStatusConnected");
}

function mountAssistantFrame() {
  if (!assistantState.studioUrl || assistantState.hasConfigError) return;
  if (!assistantState.frameLoaded) {
    assistantEls.frame.src = assistantState.studioUrl;
    assistantState.frameLoaded = true;
  }
  assistantEls.frameWrap.hidden = false;
}

async function initAssistant() {
  try {
    const response = await fetch(RAG_CONFIG_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const config = await response.json();
    assistantState.hasConfigError = false;
    renderAssistant(config.studio_url);
  } catch (error) {
    assistantState.hasConfigError = true;
    showAssistantEmpty(t("assistantLoadErrorTitle"), t("assistantLoadErrorCopy", { url: RAG_CONFIG_URL }));
  }
}

function setupViewTabs() {
  viewElements.tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      caseDetailState.activeId = "";
      document.body.classList.remove("detail-open");
      caseEls.detail.hidden = true;
      setActiveView(tab.dataset.view);
      if (tab.dataset.view === "cases") renderCases();
    });
  });

  window.addEventListener("hashchange", handleHashChange);

  handleHashChange();
}

function handleHashChange() {
  const hash = window.location.hash.replace("#", "");
  if (hash.startsWith("case=")) {
    openCaseDetail(hash.slice("case=".length), false);
    return;
  }

  caseDetailState.activeId = "";
  document.body.classList.remove("detail-open");
  caseEls.detail.hidden = true;
  setActiveView(hash || "cases", false);
  if (viewState.active === "cases") renderCases();
}

function setupMobileCollapsibleFilters() {
  const details = [...document.querySelectorAll("[data-mobile-collapsible]")];
  if (details.length === 0) return;

  const mobileQuery = window.matchMedia("(max-width: 900px)");
  let lastMobileState = null;
  const sync = () => {
    const isMobile = mobileQuery.matches;
    if (isMobile === lastMobileState) return;
    details.forEach((detail) => {
      detail.open = !isMobile;
    });
    lastMobileState = isMobile;
  };

  sync();
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", sync);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(sync);
  }
}

function valueOrPlaceholder(value, placeholder) {
  return String(value || "").trim() || placeholder;
}

function languageInstruction(value) {
  if (value === "英文") return "请使用英文输出，必要时保留关键中文术语。";
  if (value === "双语") return "请使用中英双语输出，中文先行，英文紧随其后。";
  return "请使用简体中文输出。";
}

function buildTeacherPrompt() {
  const task = valueOrPlaceholder(toolkitEls.task.value, "备课设计");
  const subject = valueOrPlaceholder(toolkitEls.subject.value, "你的学科");
  const level = valueOrPlaceholder(toolkitEls.level.value, "你的学段");
  const topic = valueOrPlaceholder(toolkitEls.topic.value, "你的教学主题");
  const duration = valueOrPlaceholder(toolkitEls.duration.value, "一节课");
  const aiTool = valueOrPlaceholder(toolkitEls.aiTool.value, "通用生成式 AI");
  const needs = valueOrPlaceholder(toolkitEls.needs.value, "学生水平存在差异，需要清晰步骤和可操作产出");
  const outputLanguage = valueOrPlaceholder(toolkitEls.language.value, "中文");

  return localizeText([
    "你是一名有经验的一线教师、课程设计师和教育技术教练。请根据以下信息，为我生成可以直接用于教学的方案。",
    "",
    `教师任务：${task}`,
    `学科：${subject}`,
    `学段：${level}`,
    `主题：${topic}`,
    `课堂时间：${duration}`,
    `可用 AI 工具：${aiTool}`,
    `学生情况：${needs}`,
    `输出语言：${outputLanguage}`,
    "",
    "请输出以下内容：",
    "1. 教学目标：用学生能理解的语言写出 2-3 条。",
    "2. 教学流程：按导入、探究/练习、产出、反馈四个阶段组织，并标明每一步教师做什么、学生做什么、AI 做什么。",
    "3. 可复制材料：给出学习单、提问卡、评价量规或反馈语句，按本任务最合适的格式输出。",
    "4. 差异化支持：给基础薄弱、普通水平和高能力学生各提供一个支持方式。",
    "5. AI 使用提醒：说明学生可以怎样使用 AI，哪些地方不能直接让 AI 代做。",
    "6. 快速检查清单：给教师上课前确认用。",
    "",
    languageInstruction(outputLanguage),
    "请避免空泛口号，所有步骤都要能在真实课堂中执行。",
  ].join("\n"));
}

function renderTeacherPrompt() {
  if (!toolkitEls.promptOutput) return;
  toolkitEls.promptOutput.textContent = buildTeacherPrompt();
}

function savedItems(type, items) {
  return items.filter((item) => favoriteState.keys.has(`${type}:${item.id}`));
}

function savedGroups() {
  return {
    cases: savedItems("case", caseState.items),
    resources: savedItems("resource", resourceState.items),
    prompts: savedItems("prompt", promptState.items),
  };
}

function renderToolkitSavedCounts() {
  if (!toolkitEls.savedCasesCount) return;
  const groups = savedGroups();
  toolkitEls.savedCasesCount.textContent = groups.cases.length;
  toolkitEls.savedResourcesCount.textContent = groups.resources.length;
  toolkitEls.savedPromptsCount.textContent = groups.prompts.length;
}

function savedLineForCase(item, index) {
  return [
    `${index + 1}. ${localizeTitle(item)}`,
    `   - ${t("category")}：${localizeValue(item.category)} / ${localizeValue(item.subcategory || item.subject)}`,
    `   - ${t("useCase")}：${localizeText(item.summary_cn)}`,
    `   - ${t("workflowTitle")}：${workflowText(item).replace(/\n/g, " ")}`,
    `   - ${t("sourceLink")}：${item.source_url}`,
  ].join("\n");
}

function savedLineForResource(item, index) {
  return [
    `${index + 1}. ${localizeTitle(item)}`,
    `   - ${t("resourceType")}：${localizeValue(item.resource_type)} / ${localizeValue(item.region)}`,
    `   - ${t("publisher")}：${localizeValue(item.publisher)}`,
    `   - ${t("useCase")}：${localizeText(item.use_case_cn || item.summary_cn)}`,
    `   - ${t("sourceLink")}：${item.source_url}`,
  ].join("\n");
}

function savedLineForPrompt(item, index) {
  return [
    `${index + 1}. ${localizeText(item.title_cn)}`,
    `   - ${t("subject")}：${localizeValue(item.subject)} / ${localizeValue(item.prompt_type)}`,
    `   - ${t("useCase")}：${localizeText(item.use_case_cn)}`,
    `   - ${t("promptCopyTitle")}：${localizeText(item.prompt_cn).replace(/\n/g, " ")}`,
    `   - ${t("sourceLink")}：${item.source_url}`,
  ].join("\n");
}

function buildSavedPack() {
  const groups = savedGroups();
  const total = groups.cases.length + groups.resources.length + groups.prompts.length;
  if (total === 0) return t("toolSavedEmpty");

  const lines = [
    "# AIED Case Hub 收藏备课包",
    "",
    `生成日期：${new Date().toISOString().slice(0, 10)}`,
    "",
  ];

  if (groups.cases.length) {
    lines.push("## 教学案例", ...groups.cases.map(savedLineForCase), "");
  }
  if (groups.resources.length) {
    lines.push("## 教材资源", ...groups.resources.map(savedLineForResource), "");
  }
  if (groups.prompts.length) {
    lines.push("## Prompt 模板", ...groups.prompts.map(savedLineForPrompt), "");
  }

  return localizeText(lines.join("\n"));
}

function renderSavedPack() {
  if (!toolkitEls.savedOutput) return;
  renderToolkitSavedCounts();
  toolkitEls.savedOutput.textContent = buildSavedPack();
}

function buildAgreement() {
  const level = valueOrPlaceholder(toolkitEls.agreementLevel.value, "中学");
  const allowed = valueOrPlaceholder(toolkitEls.agreementAllowed.value, "保守使用");
  const assessment = valueOrPlaceholder(toolkitEls.agreementAssessment.value, "只作过程支持");
  const privacy = valueOrPlaceholder(toolkitEls.agreementPrivacy.value, "不输入个人资料");
  const allowedText =
    allowed === "开放使用"
      ? "学生可以在构思、资料整理、语言润色、练习反馈和自我检查中使用 AI。"
      : "学生只可以在教师指定的环节使用 AI，例如构思、提问、修改建议和自我检查。";
  const assessmentText = {
    只作过程支持: "AI 生成内容只作为学习过程支持，最终作品必须体现学生自己的判断、修改和解释。",
    可计入过程证据: "学生可以把 AI 对话、修改记录和反思作为过程证据，但最终评分看学习目标达成与个人贡献。",
    不计入成绩: "AI 辅助内容不直接计入成绩，评分以课堂表现、个人作品和教师确认的学习证据为准。",
  }[assessment];
  const privacyText = {
    不输入个人资料: "不得输入姓名、电话、地址、账号、照片、同学信息或其他个人资料。",
    只输入匿名资料: "如需输入学习材料，请先匿名化，不出现学生姓名、班级编号或可识别信息。",
    可输入课堂材料: "可以输入教师提供的课堂材料，但不得上传未获授权的个人资料、试卷答案或受版权限制内容。",
  }[privacy];

  return localizeText(
    [
      `# ${level}课堂 AI 使用守则`,
      "",
      "1. 使用目的：AI 是学习助手，不是代写工具。你需要理解、判断、修改并能解释自己的作品。",
      `2. 允许范围：${allowedText}`,
      `3. 评价方式：${assessmentText}`,
      `4. 隐私安全：${privacyText}`,
      "5. 标注要求：凡是使用 AI 生成、修改或反馈的重要内容，都要在作品末尾注明“我如何使用了 AI”。",
      "6. 课堂底线：不得让 AI 代写整份作业、编造资料、冒充个人经历、攻击他人或绕过教师要求。",
      "7. 反思问题：提交前请回答一句话：AI 帮了我什么？我自己做出的关键判断是什么？",
    ].join("\n")
  );
}

function renderAgreement() {
  if (!toolkitEls.agreementOutput) return;
  toolkitEls.agreementOutput.textContent = buildAgreement();
}

function specialistInstruction(type) {
  const instructions = {
    评价量规:
      "请生成一个 4 档评价量规表，包含评价维度、优秀、良好、达标、需改进四列；每个描述都要可观察、可判断。最后补充 3 条学生自评问题。",
    分层改写:
      "请把任务改写成基础版、标准版和挑战版三档，每一档都保留同一个核心目标。每档给出任务说明、支架提示、预期产出和教师巡视关注点。",
    反馈语:
      "请生成可直接给学生的反馈语，按“肯定亮点、指出一个可改进点、给出下一步行动”组织。语气要具体、鼓励、不替学生完成答案。",
    家校沟通:
      "请生成一段可发给家长的沟通文字，结构为：学习表现、AI 使用说明、家庭支持建议、需要家长配合的一件小事。语气简洁、专业、不制造焦虑。",
    课堂提问:
      "请设计一组课堂提问，按回忆理解、分析比较、应用迁移、反思判断四层排列。每个问题都给一个追问和一个可能的学生困难提示。",
    "退出卡/小测":
      "请设计一个 5 分钟退出卡或小测，包含 3-5 题、参考答案、常见误区和教师下一节课可采取的跟进动作。",
  };
  return instructions[type] || instructions.评价量规;
}

function buildSpecialistPrompt() {
  const type = valueOrPlaceholder(toolkitEls.specialType.value, "评价量规");
  const subject = valueOrPlaceholder(toolkitEls.specialSubject.value, "你的学科");
  const level = valueOrPlaceholder(toolkitEls.specialLevel.value, "你的学段");
  const goal = valueOrPlaceholder(toolkitEls.specialGoal.value, "你的学习目标");
  const material = valueOrPlaceholder(toolkitEls.specialMaterial.value, "我会在这里粘贴原始材料、题目、学生作品或任务说明。");
  const constraints = valueOrPlaceholder(toolkitEls.specialConstraints.value, "请保证内容适合真实课堂使用，语言清楚，不直接代替学生完成学习任务。");

  return localizeText(
    [
      "你是一名有经验的一线教师和教学设计顾问。请根据以下信息生成可直接使用的教学支持材料。",
      "",
      `专项任务：${type}`,
      `学科：${subject}`,
      `学段：${level}`,
      `学习目标：${goal}`,
      `约束条件：${constraints}`,
      "",
      "原始材料 / 学生作品 / 任务说明：",
      material,
      "",
      "输出要求：",
      specialistInstruction(type),
      "",
      "请额外给出：",
      "1. 教师使用建议：说明这份材料适合放在课前、课中还是课后。",
      "2. AI 使用边界：提醒哪些部分可以让学生借助 AI，哪些部分必须由学生自己完成。",
      "3. 快速修改入口：列出 3 个老师可以替换的变量，方便改成其他班级或主题。",
    ].join("\n")
  );
}

function renderSpecialistPrompt() {
  if (!toolkitEls.specialOutput) return;
  toolkitEls.specialOutput.textContent = buildSpecialistPrompt();
}

function setupDynamicCopy(button, output, defaultLabelKey) {
  if (!button || !output) return;
  button.addEventListener("click", async () => {
    const defaultLabel = t(defaultLabelKey);
    try {
      await navigator.clipboard.writeText(output.textContent || "");
      button.textContent = t("copied");
    } catch {
      button.textContent = t("copyFailed");
    }
    window.setTimeout(() => {
      button.textContent = defaultLabel;
    }, 1600);
  });
}

function setupToolkit() {
  renderToolkitOptions();
  renderTeacherPrompt();
  renderSavedPack();
  renderAgreement();
  renderSpecialistPrompt();

  [
    toolkitEls.task,
    toolkitEls.subject,
    toolkitEls.level,
    toolkitEls.topic,
    toolkitEls.duration,
    toolkitEls.language,
    toolkitEls.aiTool,
    toolkitEls.needs,
  ].forEach((element) => {
    element?.addEventListener("input", renderTeacherPrompt);
    element?.addEventListener("change", renderTeacherPrompt);
  });
  toolkitEls.generatePrompt?.addEventListener("click", renderTeacherPrompt);
  toolkitEls.exportSaved?.addEventListener("click", renderSavedPack);
  [
    toolkitEls.agreementLevel,
    toolkitEls.agreementAllowed,
    toolkitEls.agreementAssessment,
    toolkitEls.agreementPrivacy,
  ].forEach((element) => {
    element?.addEventListener("input", renderAgreement);
    element?.addEventListener("change", renderAgreement);
  });
  toolkitEls.generateAgreement?.addEventListener("click", renderAgreement);
  [
    toolkitEls.specialType,
    toolkitEls.specialSubject,
    toolkitEls.specialLevel,
    toolkitEls.specialGoal,
    toolkitEls.specialMaterial,
    toolkitEls.specialConstraints,
  ].forEach((element) => {
    element?.addEventListener("input", renderSpecialistPrompt);
    element?.addEventListener("change", renderSpecialistPrompt);
  });
  toolkitEls.generateSpecial?.addEventListener("click", renderSpecialistPrompt);
  setupDynamicCopy(toolkitEls.copyPrompt, toolkitEls.promptOutput, "copyPrompt");
  setupDynamicCopy(toolkitEls.copySaved, toolkitEls.savedOutput, "toolCopySaved");
  setupDynamicCopy(toolkitEls.copyAgreement, toolkitEls.agreementOutput, "toolCopyAgreement");
  setupDynamicCopy(toolkitEls.copySpecial, toolkitEls.specialOutput, "toolCopySpecial");
}

function resetPromptFilters(overrides = {}) {
  Object.assign(promptState, {
    search: "",
    subject: "全部",
    task: "全部",
    level: "全部",
    promptType: "全部",
    skillDomain: "全部",
    evidenceStrength: "全部",
    category: "全部",
    audience: "全部",
    outputFormat: "全部",
    quality: "全部",
    linkStatus: "全部",
    favoritesOnly: false,
    sort: "quality-desc",
    page: 1,
    ...overrides,
  });
  promptEls.search.value = "";
  populatePromptControls();
  promptEls.sort.value = promptState.sort;
}

function applyPromptShortcut(shortcut) {
  if (shortcut.view === "cases") {
    caseDetailState.activeId = "";
    document.body.classList.remove("detail-open");
    caseEls.detail.hidden = true;
    setActiveView("cases");
    renderCases();
    caseEls.cards.scrollIntoView({ block: "start", behavior: "smooth" });
    return;
  }

  if (shortcut.view === "resources") {
    setActiveView("resources");
    renderResources();
    resourceEls.cards.scrollIntoView({ block: "start", behavior: "smooth" });
    return;
  }

  resetPromptFilters({
    subject: shortcut.subject || "全部",
    task: shortcut.task || "全部",
    promptType: shortcut.promptType || "全部",
    category: shortcut.category || "全部",
  });
  renderPrompts();
  promptEls.cards.scrollIntoView({ block: "start", behavior: "smooth" });
}

function renderPromptShortcuts() {
  promptEls.shortcuts.innerHTML = "";
  PROMPT_SHORTCUTS.forEach((shortcut) => {
    const button = document.createElement("button");
    button.className = "task-shortcut";
    button.type = "button";
    button.textContent = localizeValue(shortcut.label);
    button.addEventListener("click", () => applyPromptShortcut(shortcut));
    promptEls.shortcuts.append(button);
  });
}

function promptVariables(text) {
  return [...new Set([...String(text || "").matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim()).filter(Boolean))]
    .slice(0, 8);
}

function caseSearchText(item) {
  return [
    item.title_original,
    item.title_cn,
    item.category,
    item.subcategory,
    item.subject,
    item.education_level,
    item.language,
    item.region,
    item.ai_tool_or_method,
    item.summary_cn,
    item.teaching_goal_cn,
    item.implementation_cn,
    item.outcomes_cn,
    item.limitations_cn,
    item.workflow_cn,
    item.source_type,
    item.credibility,
    item.quality_label,
    item.link_status,
    tasksForItem("case", item).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function filteredCases() {
  const query = caseState.search.trim().toLowerCase();
  return caseState.items
    .filter((item) => {
      return (
        (caseState.category === "全部" || item.category === caseState.category) &&
        (caseState.subcategory === "全部" || item.subcategory === caseState.subcategory) &&
        matchesTask("case", item, caseState.task) &&
        matchesFavorite("case", item, caseState.favoritesOnly) &&
        (!query || caseSearchText(item).includes(query)) &&
        matchesField(item.education_level, caseState.level) &&
        matchesField(item.language, caseState.language) &&
        matchesField(item.region, caseState.region) &&
        matchesField(item.source_type, caseState.source) &&
        matchesField(item.ai_tool_or_method, caseState.method) &&
        matchesField(item.quality_label, caseState.quality) &&
        matchesField(item.link_status, caseState.linkStatus)
      );
    })
    .sort((a, b) => {
      if (caseState.sort === "quality-desc") return Number(b.quality_score) - Number(a.quality_score);
      if (caseState.sort === "date-asc") return dateValue(a.published_date) - dateValue(b.published_date);
      if (caseState.sort === "title-asc") return a.title_cn.localeCompare(b.title_cn, "zh-Hans-CN");
      if (caseState.sort === "region-asc") return a.region.localeCompare(b.region, "zh-Hans-CN");
      return dateValue(b.published_date) - dateValue(a.published_date);
    });
}

function caseSubcategories() {
  const source =
    caseState.category === "全部"
      ? caseState.items
      : caseState.items.filter((item) => item.category === caseState.category);
  return uniqueValues(source, "subcategory");
}

function workflowText(item) {
  if (item.workflow_cn) return localizeText(item.workflow_cn);
  const topic = localizeValue(item.subject || item.subcategory || item.category);
  const tool = localizeValue(item.ai_tool_or_method || "AI工具");
  return [
    `${t("fallbackCaseLabel")}：${localizeTitle(item)}`,
    t("fallbackCaseGoal", { topic }),
    t("fallbackCaseFlow", { tool }),
    t("fallbackCaseOutput"),
  ].join("\n");
}

function detailLinkForCase(item) {
  return new URL(`cases/${encodeURIComponent(item.id)}.html`, window.location.href).href;
}

function createDetailSection(title, value) {
  const section = document.createElement("section");
  section.className = "structured-detail-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const copy = document.createElement("p");
  copy.textContent = localizeText(value || t("notMarked"));
  section.append(heading, copy);
  return section;
}

function openCaseDetail(caseId, updateHash = true) {
  caseDetailState.activeId = decodeURIComponent(caseId || "");
  setActiveView("cases", false);
  renderCaseDetail(caseDetailState.activeId);
  if (updateHash) {
    history.replaceState(null, "", `#case=${encodeURIComponent(caseDetailState.activeId)}`);
  }
}

function closeCaseDetail(updateHash = true) {
  caseDetailState.activeId = "";
  document.body.classList.remove("detail-open");
  caseEls.detail.hidden = true;
  caseEls.detail.innerHTML = "";
  caseEls.listBlocks.forEach((block) => {
    block.hidden = false;
  });
  if (updateHash) {
    history.replaceState(null, "", "#cases");
  }
  renderCases();
}

function renderCaseDetail(caseId) {
  document.body.classList.add("detail-open");
  caseEls.listBlocks.forEach((block) => {
    block.hidden = true;
  });
  caseEls.detail.hidden = false;
  caseEls.detail.innerHTML = "";

  const item = caseState.items.find((record) => record.id === caseId);

  const header = document.createElement("div");
  header.className = "detail-header";
  const headerText = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = t("caseDetailHeading");
  const headerTitle = document.createElement("h2");
  headerTitle.textContent = item ? localizeTitle(item) : t("noCasesTitle");
  headerText.append(eyebrow, headerTitle);

  const headerActions = document.createElement("div");
  headerActions.className = "detail-actions";
  const backButton = document.createElement("button");
  backButton.className = "button button-secondary";
  backButton.type = "button";
  backButton.textContent = t("backToCases");
  backButton.addEventListener("click", () => closeCaseDetail());
  headerActions.append(backButton);
  if (item) headerActions.append(createFavoriteButton("case", item));
  header.append(headerText, headerActions);

  if (!item) {
    const empty = document.createElement("section");
    empty.className = "empty-state";
    const title = document.createElement("h2");
    title.textContent = t("noCasesTitle");
    const copy = document.createElement("p");
    copy.textContent = t("noCasesCopy");
    empty.append(title, copy);
    caseEls.detail.append(header, empty);
    return;
  }

  const article = document.createElement("article");
  article.className = "detail-card";

  const topline = document.createElement("div");
  topline.className = "case-topline";
  topline.append(createTag(item.category, "category"));
  if (item.region === "香港") topline.append(createTag("香港", "hk"));
  topline.append(createTag(item.credibility, "source"));
  const collectionTag = createCollectionTag(item);
  if (collectionTag) topline.append(collectionTag);
  topline.append(createQualityTag(item), createLinkStatusTag(item));

  const original = document.createElement("p");
  original.className = "original-title";
  original.textContent = localizeSecondaryTitle(item);

  const summary = document.createElement("p");
  summary.className = "summary detail-summary";
  summary.textContent = localizeText(item.summary_cn);

  const taskLine = document.createElement("div");
  taskLine.className = "task-line";
  tasksForItem("case", item).forEach((task) => taskLine.append(createTag(task)));

  const meta = document.createElement("dl");
  meta.className = "meta-list detail-meta";
  meta.append(
    createMeta(t("category"), item.category),
    createMeta(t("subcategory"), item.subcategory),
    createMeta(t("subjectTopic"), item.subject),
    createMeta(t("educationLevel"), item.education_level),
    createMeta(t("language"), item.language),
    createMeta(t("region"), item.region),
    createMeta(t("aiTool"), item.ai_tool_or_method),
    createMeta(t("source"), item.source_type),
    createMeta(t("credibility"), item.credibility),
    createMeta(t("published"), item.published_date),
    createMeta(t("accessed"), item.accessed_date),
    createMeta(t("lastVerified"), verifiedDate(item)),
    createMeta(t("qualityScore"), `${item.quality_score || 0}/100`),
    createMeta(t("linkStatus"), linkStatusLabel(item.link_status)),
    createMeta(t("teacherTasks"), tasksForItem("case", item).join(" / "))
  );
  if (item.http_status) meta.append(createMeta(t("httpStatus"), item.http_status));
  if (item.redirect_url) meta.append(createMeta(t("resolvedUrl"), item.redirect_url));

  const structured = document.createElement("div");
  structured.className = "structured-detail-grid";
  structured.append(
    createDetailSection(t("teachingGoal"), item.teaching_goal_cn),
    createDetailSection(t("implementation"), item.implementation_cn),
    createDetailSection(t("outcomesEvidence"), item.outcomes_cn),
    createDetailSection(t("limitations"), item.limitations_cn)
  );

  const workflow = workflowText(item);
  const workflowBlock = document.createElement("div");
  workflowBlock.className = "workflow-block detail-workflow";
  const workflowHeader = document.createElement("div");
  workflowHeader.className = "workflow-header";
  const workflowTitle = document.createElement("h4");
  workflowTitle.textContent = t("workflowTitle");
  workflowHeader.append(workflowTitle, createCopyButton(workflow, t("copyWorkflow")));
  const workflowContent = document.createElement("pre");
  workflowContent.textContent = workflow;
  workflowBlock.append(workflowHeader, workflowContent);

  const footer = document.createElement("div");
  footer.className = "detail-actions detail-footer-actions";
  const sourceLink = document.createElement("a");
  sourceLink.className = "button button-primary";
  sourceLink.href = item.source_url;
  sourceLink.target = "_blank";
  sourceLink.rel = "noreferrer";
  sourceLink.textContent = t("viewSource");
  footer.append(sourceLink, createCopyButton(detailLinkForCase(item), t("copyDetailLink")));

  article.append(topline, original, summary, taskLine, structured, meta, workflowBlock, footer);
  caseEls.detail.append(header, article);
}

function renderCaseCards(items) {
  caseEls.cards.innerHTML = "";
  caseEls.empty.hidden = items.length > 0;
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "case-card";

    const topline = document.createElement("div");
    topline.className = "case-topline";
    topline.append(createTag(item.category, "category"));
    if (item.region === "香港") topline.append(createTag("香港", "hk"));
    topline.append(createTag(item.credibility, "source"));
    const collectionTag = createCollectionTag(item);
    if (collectionTag) topline.append(collectionTag);
    topline.append(createQualityTag(item), createLinkStatusTag(item));

    const cardActions = document.createElement("div");
    cardActions.className = "card-actions";
    cardActions.append(createFavoriteButton("case", item));

    const title = document.createElement("h3");
    title.textContent = localizeTitle(item);

    const original = document.createElement("p");
    original.className = "original-title";
    original.textContent = localizeSecondaryTitle(item);

    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = localizeText(item.summary_cn);

    const taskLine = document.createElement("div");
    taskLine.className = "task-line";
    tasksForItem("case", item)
      .slice(0, 4)
      .forEach((task) => taskLine.append(createTag(task)));

    const meta = document.createElement("dl");
    meta.className = "meta-list";
    meta.append(
      createMeta(t("subcategory"), item.subcategory),
      createMeta(t("educationLevel"), item.education_level),
      createMeta(t("language"), item.language),
      createMeta(t("region"), item.region),
      createMeta(t("aiType"), item.ai_tool_or_method)
    );

    const workflow = workflowText(item);
    const workflowBlock = document.createElement("div");
    workflowBlock.className = "workflow-block";
    const workflowHeader = document.createElement("div");
    workflowHeader.className = "workflow-header";
    const workflowTitle = document.createElement("h4");
    workflowTitle.textContent = t("workflowTitle");
    workflowHeader.append(workflowTitle, createCopyButton(workflow, t("copyWorkflow")));
    const workflowContent = document.createElement("pre");
    workflowContent.textContent = workflow;
    workflowBlock.append(workflowHeader, workflowContent);

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const date = document.createElement("span");
    date.className = "date";
    date.textContent = `${t("published")}：${item.published_date || t("notMarked")} · ${t("lastVerified")}：${verifiedDate(item)}`;
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = item.source_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = t("viewSource");
    const detailLink = document.createElement("a");
    detailLink.className = "source-link detail-link";
    detailLink.href = `cases/${encodeURIComponent(item.id)}.html`;
    detailLink.textContent = t("details");
    const links = document.createElement("div");
    links.className = "card-links";
    links.append(detailLink, link);

    footer.append(date, links);
    card.append(topline, cardActions, title, original, summary, taskLine, meta, workflowBlock, footer);
    caseEls.cards.append(card);
  });
}

function renderCaseTabs() {
  caseEls.tabs.innerHTML = "";
  ["全部", ...CATEGORIES].forEach((category) => {
    const button = document.createElement("button");
    button.className = "tab";
    button.type = "button";
    button.setAttribute("aria-selected", category === caseState.category ? "true" : "false");
    button.textContent = localizeValue(category);
    button.addEventListener("click", () => {
      caseState.category = category;
      caseState.subcategory = "全部";
      caseState.page = 1;
      populateCaseControls();
      renderCases();
    });
    caseEls.tabs.append(button);
  });
}

function renderCandidateNotice() {
  if (!candidateEls.notice) return;
  const count = candidateState.items.length;
  candidateEls.notice.hidden = count === 0;
  candidateEls.preview.hidden = !candidateState.previewOpen || count === 0;

  if (count === 0) {
    candidateEls.preview.innerHTML = "";
    return;
  }

  candidateEls.countLabel.textContent = t("candidateCount", { count });
  candidateEls.note.textContent = t("candidateNote");
  candidateEls.toggle.textContent = candidateState.previewOpen ? t("hideCandidates") : t("showCandidates");
  candidateEls.toggle.setAttribute("aria-expanded", candidateState.previewOpen ? "true" : "false");

  if (!candidateState.previewOpen) {
    candidateEls.preview.innerHTML = "";
    return;
  }

  candidateEls.preview.innerHTML = "";
  const heading = document.createElement("h2");
  heading.textContent = t("candidatePreviewTitle");
  const list = document.createElement("div");
  list.className = "candidate-list";

  candidateState.items.slice(0, 6).forEach((item) => {
    const card = document.createElement("article");
    card.className = "candidate-card";

    const badge = document.createElement("span");
    badge.className = "candidate-badge";
    badge.textContent = t("candidateReviewBadge");

    const title = document.createElement("h3");
    title.textContent = localizeTitle(item);

    const summary = document.createElement("p");
    summary.textContent = localizeText(item.summary_cn);

    const meta = document.createElement("div");
    meta.className = "candidate-meta";
    meta.append(
      createTag(item.category, "category"),
      createTag(item.region),
      createTag(item.credibility)
    );

    const link = document.createElement("a");
    link.className = "source-link";
    link.href = item.source_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = t("viewSource");

    card.append(badge, title, summary, meta, link);
    list.append(card);
  });

  candidateEls.preview.append(heading, list);
}

function renderCaseStats() {
  const verifiedDates = caseState.items.map((item) => item.last_verified_date).filter(Boolean).sort();
  caseEls.total.textContent = caseState.items.length;
  viewElements.caseTabCount.textContent =
    candidateState.items.length > 0
      ? t("caseCountWithCandidates", {
          count: caseState.items.length,
          candidateCount: candidateState.items.length,
        })
      : t("caseCount", { count: caseState.items.length });
  caseEls.hongKong.textContent = caseState.items.filter((item) => item.region === "香港").length;
  caseEls.categoryCount.textContent = CATEGORIES.length;
  caseEls.lastAccessed.textContent = verifiedDates.at(-1) || t("notMarked");
}

function renderCases() {
  if (caseDetailState.activeId) {
    renderCaseDetail(caseDetailState.activeId);
    return;
  }
  document.body.classList.remove("detail-open");
  caseEls.detail.hidden = true;
  caseEls.listBlocks.forEach((block) => {
    block.hidden = false;
  });
  const items = filteredCases();
  const page = pageSlice(items, caseState);
  renderCaseTabs();
  renderCaseCards(page.items);
  renderPagination(items.length, caseState, caseEls, renderCases, caseEls.cards);
  caseEls.resultsTitle.textContent = caseState.category === "全部" ? t("allCases") : localizeValue(caseState.category);
  caseEls.resultsMeta.textContent =
    items.length === 0
      ? t("caseResultsEmpty", { total: caseState.items.length })
      : t("caseResultsRange", {
          first: page.first,
          last: page.last,
          shown: items.length,
          total: caseState.items.length,
        });
}

function populateCaseControls() {
  fillSelect(caseEls.subcategory, caseSubcategories());
  fillSelect(caseEls.task, uniqueTaskValues(caseState.items, "case"));
  fillSelect(caseEls.level, uniqueValues(caseState.items, "education_level"));
  fillSelect(caseEls.language, uniqueValues(caseState.items, "language"));
  fillSelect(caseEls.region, uniqueValues(caseState.items, "region"));
  fillSelect(caseEls.source, uniqueValues(caseState.items, "source_type"));
  fillSelect(caseEls.method, uniqueValues(caseState.items, "ai_tool_or_method"));
  fillSelect(caseEls.quality, uniqueValues(caseState.items, "quality_label"));
  fillSelect(caseEls.linkStatus, uniqueValues(caseState.items, "link_status"));
  caseEls.subcategory.value = caseState.subcategory;
  caseEls.task.value = caseState.task;
  caseEls.level.value = caseState.level;
  caseEls.language.value = caseState.language;
  caseEls.region.value = caseState.region;
  caseEls.source.value = caseState.source;
  caseEls.method.value = caseState.method;
  caseEls.quality.value = caseState.quality;
  caseEls.linkStatus.value = caseState.linkStatus;
  caseEls.favoritesOnly.checked = caseState.favoritesOnly;
  caseEls.sort.value = caseState.sort;
}

function setupCaseControls() {
  populateCaseControls();
  [
    [caseEls.search, "input", "search"],
    [caseEls.subcategory, "change", "subcategory"],
    [caseEls.task, "change", "task"],
    [caseEls.level, "change", "level"],
    [caseEls.language, "change", "language"],
    [caseEls.region, "change", "region"],
    [caseEls.source, "change", "source"],
    [caseEls.method, "change", "method"],
    [caseEls.quality, "change", "quality"],
    [caseEls.linkStatus, "change", "linkStatus"],
    [caseEls.sort, "change", "sort"],
  ].forEach(([element, eventName, key]) => {
    element.addEventListener(eventName, (event) => {
      caseState[key] = event.target.value;
      caseState.page = 1;
      renderCases();
    });
  });

  caseEls.reset.addEventListener("click", () => {
    Object.assign(caseState, {
      category: "全部",
      subcategory: "全部",
      search: "",
      level: "全部",
      language: "全部",
      region: "全部",
      source: "全部",
      method: "全部",
      quality: "全部",
      linkStatus: "全部",
      task: "全部",
      favoritesOnly: false,
      sort: "quality-desc",
      page: 1,
    });
    caseEls.search.value = "";
    populateCaseControls();
    caseEls.sort.value = "quality-desc";
    renderCases();
  });

  caseEls.favoritesOnly.addEventListener("change", (event) => {
    caseState.favoritesOnly = event.target.checked;
    caseState.page = 1;
    renderCases();
  });
}

function resourceSearchText(item) {
  return [
    item.title_original,
    item.title_cn,
    item.resource_type,
    item.category,
    item.subject,
    item.education_level,
    item.audience,
    item.language,
    item.region,
    item.publisher,
    item.summary_cn,
    item.use_case_cn,
    item.access_type,
    item.quality_label,
    item.link_status,
    tasksForItem("resource", item).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function filteredResources() {
  const query = resourceState.search.trim().toLowerCase();
  return resourceState.items
    .filter((item) => {
      return (
        (!query || resourceSearchText(item).includes(query)) &&
        matchesField(item.region, resourceState.region) &&
        matchesTask("resource", item, resourceState.task) &&
        matchesFavorite("resource", item, resourceState.favoritesOnly) &&
        matchesField(item.education_level, resourceState.level) &&
        matchesField(item.audience, resourceState.audience) &&
        matchesField(item.resource_type, resourceState.resourceType) &&
        matchesField(item.category, resourceState.category) &&
        matchesField(item.language, resourceState.language) &&
        matchesField(item.access_type, resourceState.accessType) &&
        matchesField(item.quality_label, resourceState.quality) &&
        matchesField(item.link_status, resourceState.linkStatus)
      );
    })
    .sort((a, b) => {
      if (resourceState.sort === "quality-desc") return Number(b.quality_score) - Number(a.quality_score);
      if (resourceState.sort === "date-desc") return dateValue(b.published_date) - dateValue(a.published_date);
      if (resourceState.sort === "date-asc") return dateValue(a.published_date) - dateValue(b.published_date);
      if (resourceState.sort === "region-asc") return a.region.localeCompare(b.region, "zh-Hans-CN");
      if (resourceState.sort === "publisher-asc") return a.publisher.localeCompare(b.publisher, "zh-Hans-CN");
      return a.title_cn.localeCompare(b.title_cn, "zh-Hans-CN");
    });
}

function renderResourceCards(items) {
  resourceEls.cards.innerHTML = "";
  resourceEls.empty.hidden = items.length > 0;
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "case-card resource-card";

    const topline = document.createElement("div");
    topline.className = "case-topline";
    topline.append(
      createTag(item.resource_type, "category"),
      createTag(item.region, item.region === "香港" ? "hk" : ""),
      createTag(item.access_type, "source"),
      createQualityTag(item),
      createLinkStatusTag(item)
    );

    const cardActions = document.createElement("div");
    cardActions.className = "card-actions";
    cardActions.append(createFavoriteButton("resource", item));

    const title = document.createElement("h3");
    title.textContent = localizeTitle(item);

    const original = document.createElement("p");
    original.className = "original-title";
    original.textContent = localizeSecondaryTitle(item);

    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = localizeText(item.summary_cn);

    const taskLine = document.createElement("div");
    taskLine.className = "task-line";
    tasksForItem("resource", item)
      .slice(0, 4)
      .forEach((task) => taskLine.append(createTag(task)));

    const meta = document.createElement("dl");
    meta.className = "meta-list";
    meta.append(
      createMeta(t("category"), item.category),
      createMeta(t("publisher"), item.publisher),
      createMeta(t("educationLevel"), item.education_level),
      createMeta(t("audience"), item.audience),
      createMeta(t("language"), item.language),
      createMeta(t("subjectTopic"), item.subject)
    );

    const useBlock = document.createElement("div");
    useBlock.className = "workflow-block resource-use-block";
    const useHeader = document.createElement("div");
    useHeader.className = "workflow-header";
    const useTitle = document.createElement("h4");
    useTitle.textContent = t("useCase");
    const useText = document.createElement("p");
    useText.textContent = localizeText(item.use_case_cn);
    useHeader.append(useTitle);
    useBlock.append(useHeader, useText);

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const date = document.createElement("span");
    date.className = "date";
    date.textContent = `${t("published")}：${item.published_date || t("notMarked")} · ${t("lastVerified")}：${verifiedDate(item)}`;
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = item.source_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = t("openResource");
    const detailLink = document.createElement("a");
    detailLink.className = "source-link detail-link";
    detailLink.href = `resources/${encodeURIComponent(item.id)}.html`;
    detailLink.textContent = t("details");
    const links = document.createElement("div");
    links.className = "card-links";
    links.append(detailLink, link);

    footer.append(date, links);
    card.append(topline, cardActions, title, original, summary, taskLine, meta, useBlock, footer);
    resourceEls.cards.append(card);
  });
}

function renderResourceStats() {
  const verifiedDates = resourceState.items.map((item) => item.last_verified_date).filter(Boolean).sort();
  resourceEls.total.textContent = resourceState.items.length;
  viewElements.resourceTabCount.textContent = t("resourceCount", { count: resourceState.items.length });
  resourceEls.regionCount.textContent = uniqueValues(resourceState.items, "region").length;
  resourceEls.resourceTypeCount.textContent = uniqueValues(resourceState.items, "resource_type").length;
  resourceEls.lastAccessed.textContent = verifiedDates.at(-1) || t("notMarked");
}

function renderResources() {
  const items = filteredResources();
  const page = pageSlice(items, resourceState);
  renderResourceCards(page.items);
  renderPagination(items.length, resourceState, resourceEls, renderResources, resourceEls.cards);
  resourceEls.resultsTitle.textContent =
    resourceState.category === "全部"
      ? t("allResources")
      : t("resourceTitle", { category: localizeValue(resourceState.category) });
  resourceEls.resultsMeta.textContent =
    items.length === 0
      ? t("resourceResultsEmpty", { total: resourceState.items.length })
      : t("resourceResultsRange", {
          first: page.first,
          last: page.last,
          shown: items.length,
          total: resourceState.items.length,
        });
}

function populateResourceControls() {
  fillSelect(resourceEls.region, uniqueValues(resourceState.items, "region"));
  fillSelect(resourceEls.task, uniqueTaskValues(resourceState.items, "resource"));
  fillSelect(resourceEls.level, uniqueValues(resourceState.items, "education_level"));
  fillSelect(resourceEls.audience, uniqueValues(resourceState.items, "audience"));
  fillSelect(resourceEls.resourceType, uniqueValues(resourceState.items, "resource_type"));
  fillSelect(resourceEls.category, uniqueValues(resourceState.items, "category"));
  fillSelect(resourceEls.language, uniqueValues(resourceState.items, "language"));
  fillSelect(resourceEls.accessType, uniqueValues(resourceState.items, "access_type"));
  fillSelect(resourceEls.quality, uniqueValues(resourceState.items, "quality_label"));
  fillSelect(resourceEls.linkStatus, uniqueValues(resourceState.items, "link_status"));
  resourceEls.region.value = resourceState.region;
  resourceEls.task.value = resourceState.task;
  resourceEls.level.value = resourceState.level;
  resourceEls.audience.value = resourceState.audience;
  resourceEls.resourceType.value = resourceState.resourceType;
  resourceEls.category.value = resourceState.category;
  resourceEls.language.value = resourceState.language;
  resourceEls.accessType.value = resourceState.accessType;
  resourceEls.quality.value = resourceState.quality;
  resourceEls.linkStatus.value = resourceState.linkStatus;
  resourceEls.favoritesOnly.checked = resourceState.favoritesOnly;
  resourceEls.sort.value = resourceState.sort;
}

function setupResourceControls() {
  populateResourceControls();
  [
    [resourceEls.search, "input", "search"],
    [resourceEls.region, "change", "region"],
    [resourceEls.task, "change", "task"],
    [resourceEls.level, "change", "level"],
    [resourceEls.audience, "change", "audience"],
    [resourceEls.resourceType, "change", "resourceType"],
    [resourceEls.category, "change", "category"],
    [resourceEls.language, "change", "language"],
    [resourceEls.accessType, "change", "accessType"],
    [resourceEls.quality, "change", "quality"],
    [resourceEls.linkStatus, "change", "linkStatus"],
    [resourceEls.sort, "change", "sort"],
  ].forEach(([element, eventName, key]) => {
    element.addEventListener(eventName, (event) => {
      resourceState[key] = event.target.value;
      resourceState.page = 1;
      renderResources();
    });
  });

  resourceEls.reset.addEventListener("click", () => {
    Object.assign(resourceState, {
      search: "",
      region: "全部",
      task: "全部",
      level: "全部",
      audience: "全部",
      resourceType: "全部",
      category: "全部",
      language: "全部",
      accessType: "全部",
      quality: "全部",
      linkStatus: "全部",
      favoritesOnly: false,
      sort: "quality-desc",
      page: 1,
    });
    resourceEls.search.value = "";
    populateResourceControls();
    resourceEls.sort.value = "quality-desc";
    renderResources();
  });

  resourceEls.favoritesOnly.addEventListener("change", (event) => {
    resourceState.favoritesOnly = event.target.checked;
    resourceState.page = 1;
    renderResources();
  });
}

function promptSearchText(item) {
  return [
    item.title_cn,
    item.prompt_type,
    item.skill_domain,
    item.category,
    item.subject,
    item.education_level,
    item.audience,
    item.output_format,
    item.ai_tool_or_method,
    item.prompt_cn,
    item.use_case_cn,
    item.required_inputs,
    item.optional_inputs,
    item.output_schema,
    item.evidence_strength,
    item.evidence_sources,
    item.limitations_cn,
    item.next_steps,
    item.verification_checklist,
    item.privacy_note,
    item.quality_label,
    item.link_status,
    item.source_title,
    tasksForItem("prompt", item).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function filteredPrompts() {
  const query = promptState.search.trim().toLowerCase();
  return promptState.items
    .filter((item) => {
      return (
        (!query || promptSearchText(item).includes(query)) &&
        matchesField(item.subject, promptState.subject) &&
        matchesTask("prompt", item, promptState.task) &&
        matchesFavorite("prompt", item, promptState.favoritesOnly) &&
        matchesField(item.education_level, promptState.level) &&
        matchesField(item.prompt_type, promptState.promptType) &&
        matchesField(item.skill_domain, promptState.skillDomain) &&
        matchesField(item.evidence_strength, promptState.evidenceStrength) &&
        matchesField(item.category, promptState.category) &&
        matchesField(item.audience, promptState.audience) &&
        matchesField(item.output_format, promptState.outputFormat) &&
        matchesField(item.quality_label, promptState.quality) &&
        matchesField(item.link_status, promptState.linkStatus)
      );
    })
    .sort((a, b) => {
      if (promptState.sort === "quality-desc") return Number(b.quality_score) - Number(a.quality_score);
      if (promptState.sort === "type-asc") return a.prompt_type.localeCompare(b.prompt_type, "zh-Hans-CN");
      if (promptState.sort === "title-asc") return a.title_cn.localeCompare(b.title_cn, "zh-Hans-CN");
      return a.subject.localeCompare(b.subject, "zh-Hans-CN");
    });
}

function renderPromptCards(items) {
  promptEls.cards.innerHTML = "";
  promptEls.empty.hidden = items.length > 0;
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "case-card prompt-card";

    const topline = document.createElement("div");
    topline.className = "case-topline";
    topline.append(
      createTag(item.prompt_type, "category"),
      createTag(item.skill_domain),
      createQualityTag(item),
      createLinkStatusTag(item)
    );

    const cardActions = document.createElement("div");
    cardActions.className = "card-actions";
    cardActions.append(createFavoriteButton("prompt", item));

    const title = document.createElement("h3");
    title.textContent = localizeText(item.title_cn);

    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = localizeText(item.use_case_cn);

    const variableLine = document.createElement("div");
    variableLine.className = "prompt-variable-line";
    const variableLabel = document.createElement("span");
    variableLabel.className = "prompt-variable-label";
    variableLabel.textContent = t("promptVariables");
    variableLine.append(variableLabel);
    promptVariables(item.prompt_cn).forEach((variable) => variableLine.append(createTag(localizeText(variable))));

    const taskLine = document.createElement("div");
    taskLine.className = "task-line";
    tasksForItem("prompt", item)
      .slice(0, 4)
      .forEach((task) => taskLine.append(createTag(task)));

    const meta = document.createElement("dl");
    meta.className = "meta-list";
    meta.append(
      createMeta(t("educationLevel"), item.education_level),
      createMeta(t("audience"), item.audience),
      createMeta(t("outputFormatMeta"), item.output_format),
      createMeta(t("evidenceStrength"), item.evidence_strength),
      createMeta(t("aiTool"), item.ai_tool_or_method),
      createMeta(t("qualityScore"), `${item.quality_score || 0}/100`)
    );

    const skillDetails = document.createElement("details");
    skillDetails.className = "skill-structure";
    const skillSummary = document.createElement("summary");
    skillSummary.textContent = t("skillStructure");
    const skillGrid = document.createElement("dl");
    skillGrid.className = "meta-list skill-structure-grid";
    skillGrid.append(
      createMeta(t("requiredInputs"), item.required_inputs),
      createMeta(t("optionalInputs"), item.optional_inputs),
      createMeta(t("outputSchema"), item.output_schema),
      createMeta(t("promptLimitations"), item.limitations_cn),
      createMeta(t("nextSteps"), item.next_steps),
      createMeta(t("verificationChecklist"), item.verification_checklist),
      createMeta(t("privacyNote"), item.privacy_note)
    );
    skillDetails.append(skillSummary, skillGrid);

    const prompt = localizeText(item.prompt_cn);
    const promptBlock = document.createElement("div");
    promptBlock.className = "workflow-block prompt-block";
    const promptHeader = document.createElement("div");
    promptHeader.className = "workflow-header";
    const promptTitle = document.createElement("h4");
    promptTitle.textContent = t("promptCopyTitle");
    promptHeader.append(promptTitle, createCopyButton(prompt, t("copyPrompt")));
    const promptText = document.createElement("pre");
    promptText.textContent = prompt;
    promptBlock.append(promptHeader, promptText);

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const source = document.createElement("span");
    source.className = "date";
    source.textContent = `${t("reference")}：${localizeText(item.source_title)} · ${t("lastVerified")}：${verifiedDate(item)}`;
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = item.source_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = t("sourceLink");
    const detailLink = document.createElement("a");
    detailLink.className = "source-link detail-link";
    detailLink.href = `prompts/${encodeURIComponent(item.id)}.html`;
    detailLink.textContent = t("details");
    const links = document.createElement("div");
    links.className = "card-links";
    links.append(detailLink, link);

    footer.append(source, links);
    card.append(topline, cardActions, title, summary, variableLine, taskLine, meta, skillDetails, promptBlock, footer);
    promptEls.cards.append(card);
  });
}

function renderPromptStats() {
  const verifiedDates = promptState.items.map((item) => item.last_verified_date).filter(Boolean).sort();
  promptEls.total.textContent = promptState.items.length;
  viewElements.promptTabCount.textContent = t("promptCount", { count: promptState.items.length });
  promptEls.subjectCount.textContent = uniqueValues(promptState.items, "subject").length;
  promptEls.promptTypeCount.textContent = uniqueValues(promptState.items, "prompt_type").length;
  promptEls.lastAccessed.textContent = verifiedDates.at(-1) || t("notMarked");
}

function renderPrompts() {
  const items = filteredPrompts();
  const page = pageSlice(items, promptState);
  renderPromptCards(page.items);
  renderPagination(items.length, promptState, promptEls, renderPrompts, promptEls.cards);
  promptEls.resultsTitle.textContent =
    promptState.subject === "全部"
      ? t("allPrompts")
      : t("promptTitle", { subject: localizeValue(promptState.subject) });
  promptEls.resultsMeta.textContent =
    items.length === 0
      ? t("promptResultsEmpty", { total: promptState.items.length })
      : t("promptResultsRange", {
          first: page.first,
          last: page.last,
          shown: items.length,
          total: promptState.items.length,
        });
}

function populatePromptControls() {
  fillSelect(promptEls.subject, uniqueValues(promptState.items, "subject"));
  fillSelect(promptEls.task, uniqueTaskValues(promptState.items, "prompt"));
  fillSelect(promptEls.level, uniqueValues(promptState.items, "education_level"));
  fillSelect(promptEls.promptType, uniqueValues(promptState.items, "prompt_type"));
  fillSelect(promptEls.skillDomain, uniqueValues(promptState.items, "skill_domain"));
  fillSelect(promptEls.evidenceStrength, uniqueValues(promptState.items, "evidence_strength"));
  fillSelect(promptEls.category, uniqueValues(promptState.items, "category"));
  fillSelect(promptEls.audience, uniqueValues(promptState.items, "audience"));
  fillSelect(promptEls.outputFormat, uniqueValues(promptState.items, "output_format"));
  fillSelect(promptEls.quality, uniqueValues(promptState.items, "quality_label"));
  fillSelect(promptEls.linkStatus, uniqueValues(promptState.items, "link_status"));
  promptEls.subject.value = promptState.subject;
  promptEls.task.value = promptState.task;
  promptEls.level.value = promptState.level;
  promptEls.promptType.value = promptState.promptType;
  promptEls.skillDomain.value = promptState.skillDomain;
  promptEls.evidenceStrength.value = promptState.evidenceStrength;
  promptEls.category.value = promptState.category;
  promptEls.audience.value = promptState.audience;
  promptEls.outputFormat.value = promptState.outputFormat;
  promptEls.quality.value = promptState.quality;
  promptEls.linkStatus.value = promptState.linkStatus;
  promptEls.favoritesOnly.checked = promptState.favoritesOnly;
  promptEls.sort.value = promptState.sort;
}

function setupPromptControls() {
  populatePromptControls();
  [
    [promptEls.search, "input", "search"],
    [promptEls.subject, "change", "subject"],
    [promptEls.task, "change", "task"],
    [promptEls.level, "change", "level"],
    [promptEls.promptType, "change", "promptType"],
    [promptEls.skillDomain, "change", "skillDomain"],
    [promptEls.evidenceStrength, "change", "evidenceStrength"],
    [promptEls.category, "change", "category"],
    [promptEls.audience, "change", "audience"],
    [promptEls.outputFormat, "change", "outputFormat"],
    [promptEls.quality, "change", "quality"],
    [promptEls.linkStatus, "change", "linkStatus"],
    [promptEls.sort, "change", "sort"],
  ].forEach(([element, eventName, key]) => {
    element.addEventListener(eventName, (event) => {
      promptState[key] = event.target.value;
      promptState.page = 1;
      renderPrompts();
    });
  });

  promptEls.reset.addEventListener("click", () => {
    resetPromptFilters();
    renderPrompts();
  });

  promptEls.favoritesOnly.addEventListener("change", (event) => {
    promptState.favoritesOnly = event.target.checked;
    promptState.page = 1;
    renderPrompts();
  });
}

function renderLearningPaths() {
  if (!pathEls.grid) return;
  pathEls.grid.innerHTML = "";
  pathState.items.forEach((path) => {
    const card = document.createElement("article");
    card.className = "learning-path-card";
    const topline = document.createElement("div");
    topline.className = "case-topline";
    topline.append(createTag(path.duration, "category"), createTag(path.audience));
    const title = document.createElement("h3");
    title.textContent = languageState.current === "en" ? path.title_en || path.title_cn : localizeText(path.title_cn);
    const description = document.createElement("p");
    description.className = "summary";
    description.textContent = localizeText(path.description_cn);
    const footer = document.createElement("div");
    footer.className = "learning-path-footer";
    const count = document.createElement("span");
    count.textContent = t("pathSteps", { count: path.steps?.length || 0 });
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = `paths/${encodeURIComponent(path.id)}.html`;
    link.textContent = t("openPath");
    footer.append(count, link);
    card.append(topline, title, description, footer);
    pathEls.grid.append(card);
  });
  if (pathEls.section) pathEls.section.hidden = pathState.items.length === 0;
}

async function initLearningPaths() {
  try {
    const response = await fetch(DATA_URLS.paths);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    pathState.items = await response.json();
    renderLearningPaths();
  } catch {
    pathState.items = [];
    if (pathEls.section) pathEls.section.hidden = true;
  }
}

async function loadData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseCsv(await response.text());
}

function showLoadError(elements, url, error) {
  elements.resultsTitle.textContent = t("loadErrorTitle");
  elements.resultsMeta.textContent = t("loadErrorMeta", { url });
  elements.empty.hidden = false;
  elements.empty.querySelector("h2").textContent = t("csvErrorTitle");
  elements.empty.querySelector("p").textContent = error.message;
}

async function initCases() {
  try {
    caseState.items = await loadData(DATA_URLS.cases);
    setupCaseControls();
    renderCaseStats();
    renderCases();
    renderToolkitSavedCounts();
  } catch (error) {
    showLoadError(caseEls, DATA_URLS.cases, error);
  }
}

function setupCandidateControls() {
  if (!candidateEls.toggle) return;
  candidateEls.toggle.addEventListener("click", () => {
    candidateState.previewOpen = !candidateState.previewOpen;
    renderCandidateNotice();
  });
}

async function initCandidates() {
  try {
    candidateState.items = await loadData(DATA_URLS.candidates);
    renderCandidateNotice();
    if (caseState.items.length > 0) {
      renderCaseStats();
    }
  } catch {
    candidateState.items = [];
    renderCandidateNotice();
  }
}

async function initResources() {
  try {
    resourceState.items = await loadData(DATA_URLS.resources);
    setupResourceControls();
    renderResourceStats();
    renderResources();
    renderToolkitSavedCounts();
  } catch (error) {
    showLoadError(resourceEls, DATA_URLS.resources, error);
  }
}

async function initPrompts() {
  try {
    promptState.items = await loadData(DATA_URLS.prompts);
    setupPromptControls();
    renderPromptStats();
    renderPrompts();
    renderToolkitSavedCounts();
  } catch (error) {
    showLoadError(promptEls, DATA_URLS.prompts, error);
  }
}

setupLanguageControl();
refreshLanguage();
setupViewTabs();
setupMobileCollapsibleFilters();
setupToolkit();
setupCandidateControls();
initCases();
initCandidates();
initResources();
initPrompts();
initLearningPaths();
initAssistant();
