// AIContextShare UI 核心交互逻辑

let storeData = null;
let activeProject = null;
let currentTemplateId = 'tpl_standard';
let debounceTimer = null;

// DOM 元素引用
const el = {
  projectTabs: document.getElementById('projectTabs'),
  btnNewProject: document.getElementById('btnNewProject'),
  platformChips: document.getElementById('platformChips'),
  taskConsensus: document.getElementById('taskConsensus'),
  taskTodo: document.getElementById('taskTodo'),
  btnCaptureCurrent: document.getElementById('btnCaptureCurrent'),
  btnClearConsensus: document.getElementById('btnClearConsensus'),
  projName: document.getElementById('projName'),
  projTechStack: document.getElementById('projTechStack'),
  projRules: document.getElementById('projRules'),
  detailsL2: document.getElementById('detailsL2'),
  promptPreview: document.getElementById('promptPreview'),
  charCountBadge: document.getElementById('charCountBadge'),
  tokenEstBadge: document.getElementById('tokenEstBadge'),
  templateSelect: document.getElementById('templateSelect'),
  btnCopyOnly: document.getElementById('btnCopyOnly'),
  btnInject: document.getElementById('btnInject'),
  btnSettings: document.getElementById('btnSettings'),
  btnMinimize: document.getElementById('btnMinimize'),
  btnClose: document.getElementById('btnClose'),
  settingsModal: document.getElementById('settingsModal'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  settingRole: document.getElementById('settingRole'),
  settingConstraints: document.getElementById('settingConstraints'),
  settingAutoPaste: document.getElementById('settingAutoPaste'),
  btnExport: document.getElementById('btnExport'),
  btnImport: document.getElementById('btnImport'),
  toast: document.getElementById('toast'),
  // 新建项目模态框元素
  newProjectModal: document.getElementById('newProjectModal'),
  btnCloseNewProjModal: document.getElementById('btnCloseNewProjModal'),
  newProjNameInput: document.getElementById('newProjNameInput'),
  newProjTechInput: document.getElementById('newProjTechInput'),
  newProjRulesInput: document.getElementById('newProjRulesInput'),
  btnCancelNewProj: document.getElementById('btnCancelNewProj'),
  btnConfirmNewProj: document.getElementById('btnConfirmNewProj')
};

// 平台风格预设
const PLATFORM_PRESETS = {
  universal: {
    header: '【AI 上下文交接胶囊】',
    tail: '请基于以上已有进展直接开始，无需重复前序背景。'
  },
  coding: {
    header: '【工程上下文与交接卡片】',
    tail: '请严格遵循上述技术栈与架构规范，给出清晰、可运行的代码与变更说明，无需过多客套。'
  },
  deepseek: {
    header: '【任务背景与前置逻辑】',
    tail: '请启动深度推理，对上述已有共识进行逻辑校验并推导下一步实施方案。'
  },
  claude: {
    header: '【Context & Working Memory Handover】',
    tail: 'Please adopt the specified persona and proceed from the latest consensus with high precision.'
  }
};

// 初始化
async function init() {
  await loadStore();
  bindEvents();
}

// 加载全量数据
async function loadStore() {
  if (window.electronAPI) {
    storeData = await window.electronAPI.getStore();
  } else {
    // 降级本地测试假数据
    storeData = {
      activeProjectId: 'p1',
      targetPlatform: 'universal',
      autoPaste: true,
      globalPersona: { role: '资深全栈架构师', constraints: '直奔主题，给出完整方案' },
      projects: [{
        id: 'p1', name: 'AIContextShare',
        tech_stack: 'Electron 44, Node 24, CSS Glassmorphism',
        business_rules: '纯本地离线隐私安全',
        current_task: { latest_consensus: '已确认 Alt+C 呼出与模拟注入方案', todo: '编写界面' }
      }],
      templates: [{ id: 'tpl_standard', name: '标准跨工具交接模版' }]
    };
  }

  activeProject = storeData.projects.find(p => p.id === storeData.activeProjectId) || storeData.projects[0];
  renderProjectTabs();
  renderPlatformChips();
  renderTemplateSelect();
  populateForm();
  updatePreview();
}

// 渲染项目 Tabs
function renderProjectTabs() {
  el.projectTabs.innerHTML = '';
  storeData.projects.forEach(p => {
    const btn = document.createElement('button');
    btn.className = `project-tab ${p.id === activeProject.id ? 'active' : ''}`;
    btn.textContent = p.name;
    btn.title = p.description || p.name;
    btn.addEventListener('click', () => switchProject(p.id));
    el.projectTabs.appendChild(btn);
  });
}

// 渲染平台芯片
function renderPlatformChips() {
  const chips = el.platformChips.querySelectorAll('.chip');
  chips.forEach(chip => {
    const p = chip.dataset.platform;
    if (p === storeData.targetPlatform) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      storeData.targetPlatform = p;
      saveCurrentState();
      updatePreview();
    };
  });
}

// 渲染模板下拉
function renderTemplateSelect() {
  el.templateSelect.innerHTML = '';
  (storeData.templates || []).forEach(tpl => {
    const opt = document.createElement('option');
    opt.value = tpl.id;
    opt.textContent = tpl.name;
    if (tpl.id === currentTemplateId) opt.selected = true;
    el.templateSelect.appendChild(opt);
  });
}

// 填充表单数据
function populateForm() {
  if (!activeProject) return;
  const t = activeProject.current_task || {};
  el.taskConsensus.value = t.latest_consensus || '';
  el.taskTodo.value = t.todo || '';

  el.projName.value = activeProject.name || '';
  el.projTechStack.value = activeProject.tech_stack || '';
  el.projRules.value = activeProject.business_rules || '';

  // 设置模态框
  el.settingRole.value = storeData.globalPersona?.role || '';
  el.settingConstraints.value = storeData.globalPersona?.constraints || '';
  el.settingAutoPaste.checked = storeData.autoPaste !== false;
}

// 组装 Prompt
function generatePrompt() {
  if (!activeProject) return '';
  const p = activeProject;
  const t = p.current_task || {};
  const per = storeData.globalPersona || {};
  const platform = storeData.targetPlatform || 'universal';
  const preset = PLATFORM_PRESETS[platform] || PLATFORM_PRESETS.universal;

  const selectedTpl = (storeData.templates || []).find(tpl => tpl.id === currentTemplateId);
  let templateText = selectedTpl?.content;

  if (!templateText) {
    templateText = `${preset.header}
📌 **项目背景**：{project_name}
🛠️ **技术栈**：{tech_stack}
📋 **业务规范**：{business_rules}
✅ **前序工具已确定的进展/结论**：
{latest_consensus}
🎯 **本轮核心目标**：
{todo}
👤 **回答要求**：{role}，{constraints}
─────────────────────────────
${preset.tail}`;
  }

  const replacements = {
    '{project_name}': p.name || '默认项目',
    '{tech_stack}': p.tech_stack || '未指定',
    '{business_rules}': p.business_rules || '无特殊硬性约束',
    '{latest_consensus}': (t.latest_consensus && t.latest_consensus.trim()) ? t.latest_consensus.trim() : '（无前序交接内容）',
    '{todo}': (t.todo && t.todo.trim()) ? t.todo.trim() : '推进当前功能实现',
    '{role}': per.role || '专家',
    '{constraints}': per.constraints || '务实准确，直入主题'
  };

  let res = templateText;
  for (const [k, v] of Object.entries(replacements)) {
    res = res.split(k).join(v);
  }
  return res.trim();
}

// 刷新右侧预览与字数
function updatePreview() {
  const text = generatePrompt();
  el.promptPreview.value = text;
  
  const charLen = text.length;
  el.charCountBadge.textContent = `${charLen} 字`;
  // 中文约 1.5-2 字符/token，英文约 4 字符/token，取粗略估算
  const estTokens = Math.round(charLen * 0.7);
  el.tokenEstBadge.textContent = `约 ${estTokens} Token`;
}

// 切换项目
function switchProject(id) {
  saveCurrentStateImmediate();
  storeData.activeProjectId = id;
  activeProject = storeData.projects.find(p => p.id === id);
  if (window.electronAPI) window.electronAPI.setActiveProject(id);
  renderProjectTabs();
  populateForm();
  updatePreview();
  showToast(`已切换至项目：${activeProject.name}`);
}

// 收集当前输入保存
function saveCurrentState() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveCurrentStateImmediate();
  }, 350);
}

function saveCurrentStateImmediate() {
  if (!activeProject) return;
  activeProject.name = el.projName.value.trim() || activeProject.name;
  activeProject.tech_stack = el.projTechStack.value.trim();
  activeProject.business_rules = el.projRules.value.trim();
  
  if (!activeProject.current_task) activeProject.current_task = {};
  activeProject.current_task.latest_consensus = el.taskConsensus.value;
  activeProject.current_task.todo = el.taskTodo.value;

  if (window.electronAPI) {
    window.electronAPI.updateProject(activeProject);
    window.electronAPI.saveStore(storeData);
  }
}

// 提示气泡
let toastTimer = null;
function showToast(msg) {
  clearTimeout(toastTimer);
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    el.toast.classList.add('hidden');
  }, 2200);
}

// 绑定交互事件
function bindEvents() {
  // 输入防抖同步与预览
  [el.taskConsensus, el.taskTodo, el.projName, el.projTechStack, el.projRules].forEach(input => {
    input.addEventListener('input', () => {
      saveCurrentState();
      updatePreview();
    });
  });

  // 模板切换
  el.templateSelect.addEventListener('change', (e) => {
    currentTemplateId = e.target.value;
    updatePreview();
  });

  // 创建新项目 - 打开内嵌模态框
  function openNewProjectModal() {
    el.newProjNameInput.value = '';
    el.newProjTechInput.value = '';
    el.newProjRulesInput.value = '';
    el.newProjectModal.classList.remove('hidden');
    setTimeout(() => el.newProjNameInput.focus(), 80);
  }

  function closeNewProjectModal() {
    el.newProjectModal.classList.add('hidden');
  }

  function handleCreateNewProject() {
    const name = el.newProjNameInput.value.trim();
    if (!name) {
      showToast('请输入项目名称');
      el.newProjNameInput.focus();
      return;
    }
    const newProj = {
      id: 'proj_' + Date.now(),
      name: name,
      description: '',
      tech_stack: el.newProjTechInput.value.trim(),
      business_rules: el.newProjRulesInput.value.trim(),
      current_task: { title: '初始任务', latest_consensus: '', todo: '' }
    };
    storeData.projects.push(newProj);
    closeNewProjectModal();
    switchProject(newProj.id);
    showToast(`项目「${name}」已创建！`);
  }

  el.btnNewProject.addEventListener('click', openNewProjectModal);
  el.btnCloseNewProjModal.addEventListener('click', closeNewProjectModal);
  el.btnCancelNewProj.addEventListener('click', closeNewProjectModal);
  el.btnConfirmNewProj.addEventListener('click', handleCreateNewProject);

  // 在新建弹窗的输入框内按回车直接提交创建
  [el.newProjNameInput, el.newProjTechInput].forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleCreateNewProject();
      }
    });
  });

  // 仅复制
  el.btnCopyOnly.addEventListener('click', async () => {
    saveCurrentStateImmediate();
    const text = el.promptPreview.value;
    if (window.electronAPI) {
      await window.electronAPI.copyToClipboard(text);
    } else {
      navigator.clipboard.writeText(text);
    }
    showToast('已复制到剪贴板！');
  });

  // 一键注入并粘贴
  el.btnInject.addEventListener('click', executeInject);

  // 清空本阶段结论
  el.btnClearConsensus.addEventListener('click', () => {
    el.taskConsensus.value = '';
    saveCurrentState();
    updatePreview();
    showToast('已清空当前结论');
  });

  // 吸取剪贴板
  el.btnCaptureCurrent.addEventListener('click', async () => {
    let clipText = '';
    if (navigator.clipboard) {
      try {
        clipText = await navigator.clipboard.readText();
      } catch (e) {
        // Fallback
      }
    }
    if (clipText && clipText.trim()) {
      if (el.taskConsensus.value.trim()) {
        el.taskConsensus.value += '\n• ' + clipText.trim();
      } else {
        el.taskConsensus.value = clipText.trim();
      }
      saveCurrentState();
      updatePreview();
      showToast('已吸取剪贴板内容到结论！');
    } else {
      showToast('剪贴板中暂无文本');
    }
  });

  // 窗口动作
  el.btnMinimize.addEventListener('click', () => {
    if (window.electronAPI) window.electronAPI.minimizeWindow();
  });
  el.btnClose.addEventListener('click', () => {
    if (window.electronAPI) window.electronAPI.hideWindow();
  });

  // 键盘快捷键监听
  window.addEventListener('keydown', (e) => {
    // Esc 隐藏弹窗或隐藏主窗口
    if (e.key === 'Escape') {
      if (!el.newProjectModal.classList.contains('hidden')) {
        closeNewProjectModal();
      } else if (!el.settingsModal.classList.contains('hidden')) {
        el.settingsModal.classList.add('hidden');
      } else if (window.electronAPI) {
        window.electronAPI.hideWindow();
      }
      return;
    }

    // 若有弹窗处于打开状态，不触发主界面的快捷注入
    if (!el.newProjectModal.classList.contains('hidden') || !el.settingsModal.classList.contains('hidden')) {
      return;
    }

    // Ctrl + Enter 或 在非多行聚焦时按 Enter，立即注入
    if ((e.ctrlKey && e.key === 'Enter') || (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      executeInject();
    }
  });

  // 设置模态框
  el.btnSettings.addEventListener('click', () => {
    el.settingsModal.classList.remove('hidden');
  });
  el.btnCloseModal.addEventListener('click', () => {
    // 保存偏好
    storeData.globalPersona = {
      role: el.settingRole.value.trim(),
      constraints: el.settingConstraints.value.trim()
    };
    storeData.autoPaste = el.settingAutoPaste.checked;
    if (window.electronAPI) window.electronAPI.saveStore(storeData);
    updatePreview();
    el.settingsModal.classList.add('hidden');
  });

  // 导出/导入
  el.btnExport.addEventListener('click', async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.exportData();
      if (res.success) showToast('导出成功！');
    }
  });
  el.btnImport.addEventListener('click', async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.importData();
      if (res.success) {
        showToast('导入成功，正在重载配置...');
        setTimeout(() => loadStore(), 500);
      }
    }
  });

  // 监听外部主进程事件
  if (window.electronAPI) {
    window.electronAPI.onWindowShown(() => {
      loadStore();
    });
    window.electronAPI.onCaptureNotify((data) => {
      showToast(`已通过快捷键吸取到 [${data.projectName}]`);
      loadStore();
    });
  }
}

// 执行注入动作
async function executeInject() {
  saveCurrentStateImmediate();
  const text = el.promptPreview.value;
  if (!text.trim()) {
    showToast('注入内容为空');
    return;
  }
  const autoPaste = storeData.autoPaste !== false;
  if (window.electronAPI) {
    const res = await window.electronAPI.injectContext(text, autoPaste);
    showToast(res.message || '注入完毕');
  } else {
    navigator.clipboard.writeText(text);
    showToast('已复制（开发模式）');
  }
}

// 启动
window.addEventListener('DOMContentLoaded', init);
