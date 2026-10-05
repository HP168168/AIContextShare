/**
 * 上下文模版与 Prompt 组装引擎
 */

const PLATFORM_PRESETS = {
  universal: {
    name: '通用交接 (Universal)',
    header: '【AI 上下文交接胶囊】',
    tail: '请基于以上已有进展直接开始，无需重复前序背景。'
  },
  coding: {
    name: '代码与工程 (Code & Dev)',
    header: '【工程上下文与交接卡片】',
    tail: '请严格遵循上述技术栈与架构规范，给出清晰、可运行的代码与变更说明，无需过多客套。'
  },
  deepseek: {
    name: 'DeepSeek / 深度思考模式',
    header: '【任务背景与前置逻辑】',
    tail: '请启动深度推理，对上述已有共识进行逻辑校验并推导下一步实施方案。'
  },
  claude: {
    name: 'Claude / 高保真长文本',
    header: '【Context & Working Memory Handover】',
    tail: 'Please adopt the specified persona and proceed from the latest consensus with high precision.'
  }
};

/**
 * 组装上下文 Prompt
 * @param {Object} project 当前项目对象
 * @param {Object} persona 全局人设对象
 * @param {Object} task 当前任务对象
 * @param {string} template 选中的模板内容
 * @param {string} targetPlatform 目标平台标识
 */
function buildContextPrompt({ project, persona, task, template, targetPlatform = 'universal' }) {
  const p = project || {};
  const per = persona || {};
  const t = task || p.current_task || {};
  const preset = PLATFORM_PRESETS[targetPlatform] || PLATFORM_PRESETS.universal;

  // 默认结构化模板
  let content = template;
  if (!content) {
    content = `${preset.header}
📌 **项目背景**：{project_name}
🛠️ **技术栈/架构**：{tech_stack}
📋 **业务规范与约束**：{business_rules}
✅ **前序工具已确定的进展/共识**：
{latest_consensus}
🎯 **本轮核心目标/待办**：
{todo}
👤 **角色与回答要求**：{role}，{constraints}
─────────────────────────────
${preset.tail}`;
  }

  // 变量置换
  const replacements = {
    '{project_name}': p.name || '默认项目',
    '{project_desc}': p.description || '',
    '{tech_stack}': p.tech_stack || '未指定',
    '{business_rules}': p.business_rules || '按行业通用标准',
    '{latest_consensus}': t.latest_consensus ? t.latest_consensus.trim() : '（初始会话，暂无前序决策）',
    '{todo}': t.todo ? t.todo.trim() : '推进当前项目核心功能',
    '{task_title}': t.title || '当前工作流',
    '{role}': per.role || '资深专家',
    '{language}': per.language || '简体中文',
    '{constraints}': per.constraints || '务实准确，直入主题，拒绝模板空话'
  };

  let result = content;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }

  return result.trim();
}

module.exports = {
  PLATFORM_PRESETS,
  buildContextPrompt
};
