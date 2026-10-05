const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// 优先保存在项目根目录的 data 文件夹，方便用户直观查看与 git 管理；打包后可回退至 userData
function getDataPath() {
  const localDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(localDir)) {
    try {
      fs.mkdirSync(localDir, { recursive: true });
    } catch (e) {
      if (app) {
        return path.join(app.getPath('userData'), 'context_store.json');
      }
    }
  }
  return path.join(localDir, 'context_store.json');
}

const DEFAULT_DATA = {
  activeProjectId: 'proj_dev_01',
  targetPlatform: 'universal',
  autoPaste: true,
  globalPersona: {
    role: '资深全栈工程师 / 架构顾问',
    language: '简体中文',
    constraints: '输出高质量、无冗余的解答，代码给出完整逻辑或精准 diff，不带寒暄套话。'
  },
  accounts: [
    { id: 'acc_1', name: 'ChatGPT-个人', platform: 'chatgpt' },
    { id: 'acc_2', name: 'Claude-代码主力', platform: 'claude' },
    { id: 'acc_3', name: 'DeepSeek-深度思考', platform: 'deepseek' },
    { id: 'acc_4', name: 'workbuddy-桌面端', platform: 'workbuddy' },
    { id: 'acc_5', name: 'codebuddy-桌面端', platform: 'codebuddy' },
    { id: 'acc_6', name: 'Antigravity-智能体', platform: 'antigravity' },
    { id: 'acc_7', name: 'Kimi-长文调研', platform: 'kimi' },
    { id: 'acc_8', name: '豆包-日常搜索', platform: 'doubao' }
  ],
  projects: [
    {
      id: 'proj_dev_01',
      name: 'AIContextShare 上下文工具',
      description: '多 AI 工具与多账号之间的上下文共享便携底座',
      tech_stack: 'Electron 44, Node.js 24, Vanilla JS, CSS3 Glassmorphism, PowerShell Automation',
      business_rules: '纯本地离线隐私安全，全键盘快捷驱动，兼容浏览器与各大桌面 AI 客户端',
      tags: ['个人项目', '提效利器'],
      current_task: {
        title: '跨平台上下文无缝注入与快速吸取',
        latest_consensus: '已确认采用毛玻璃悬浮胶囊形态 (Alt+C 呼出)，通过模拟粘贴实现浏览器与桌面工具(workbuddy/codebuddy/Antigravity)的全覆盖',
        todo: '实现暗黑毛玻璃界面、分层提示词组装与快捷划词捕获'
      }
    },
    {
      id: 'proj_fullstack_02',
      name: '跨境电商独立站架构升级',
      description: '基于 Next.js 14 与 Stripe 的自营电商独立站系统',
      tech_stack: 'Next.js, TypeScript, TailwindCSS, Zustand, PostgreSQL, Prisma',
      business_rules: '满足 GDPR 隐私合规，支付流程要求幂等性，全站支持多语言与 SEO 结构化标记',
      tags: ['工作业务', 'Next.js'],
      current_task: {
        title: '购物车与多币种结账结算流',
        latest_consensus: '已在 Claude 产出结账状态机流程图与 Stripe Webhook 签名校验逻辑',
        todo: '在 DeepSeek 或 codebuddy 中审计高并发扣减库存的数据库死锁风险'
      }
    }
  ],
  templates: [
    {
      id: 'tpl_standard',
      name: '标准跨工具交接模版',
      content: `【AI 上下文交接胶囊】
📌 **项目背景**：{project_name}
🛠️ **技术栈**：{tech_stack}
📋 **业务规范**：{business_rules}
✅ **前序工具已确定的进展/结论**：
{latest_consensus}
🎯 **本轮核心目标**：
{todo}
👤 **回答要求**：{role}，{constraints}
─────────────────────────────
请基于以上已有进展直接开始，无需重复前序背景。`
    },
    {
      id: 'tpl_code_audit',
      name: '代码审计与重构模版',
      content: `【工程审查上下文】
项目：{project_name}（{tech_stack}）
规范约束：{business_rules}
前序决策：{latest_consensus}
审查/实现任务：{todo}
请以【{role}】视角，直接指出漏洞或给出优化代码，保持极高工程水准。`
    },
    {
      id: 'tpl_minimal',
      name: '极简进展接力',
      content: `【上下文接力】
我们正在进行「{project_name}」项目。
上一阶段结论：{latest_consensus}
当前需要解决：{todo}
请直接给出方案。`
    }
  ],
  snapshots: []
};

class Store {
  constructor() {
    this.filePath = getDataPath();
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_DATA, ...parsed };
      }
    } catch (err) {
      console.error('[Store] 读取数据失败，使用默认配置:', err);
    }
    this.save(DEFAULT_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  save(dataToSave) {
    try {
      this.data = dataToSave || this.data;
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[Store] 写入数据失败:', err);
      return false;
    }
  }

  getAll() {
    return this.data;
  }

  getActiveProject() {
    return this.data.projects.find(p => p.id === this.data.activeProjectId) || this.data.projects[0];
  }

  setActiveProject(id) {
    if (this.data.projects.some(p => p.id === id)) {
      this.data.activeProjectId = id;
      this.save();
      return true;
    }
    return false;
  }

  updateProject(project) {
    const idx = this.data.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      this.data.projects[idx] = { ...this.data.projects[idx], ...project };
    } else {
      this.data.projects.push(project);
    }
    this.save();
    return this.data;
  }

  deleteProject(projectId) {
    if (this.data.projects.length <= 1) {
      return { success: false, error: '至少需要保留一个项目' };
    }
    this.data.projects = this.data.projects.filter(p => p.id !== projectId);
    if (this.data.activeProjectId === projectId) {
      this.data.activeProjectId = this.data.projects[0].id;
    }
    this.save();
    return { success: true };
  }

  // 划词捕获：追加或替换到当前任务的 latest_consensus
  captureToConsensus(text, mode = 'append') {
    if (!text || !text.trim()) return false;
    const project = this.getActiveProject();
    if (!project) return false;

    if (!project.current_task) {
      project.current_task = { title: '通用任务', latest_consensus: '', todo: '' };
    }

    const cleanText = text.trim();
    if (mode === 'append' && project.current_task.latest_consensus) {
      project.current_task.latest_consensus += `\n• ${cleanText}`;
    } else {
      project.current_task.latest_consensus = cleanText;
    }

    this.save();
    return true;
  }

  // 记录一次注入/交接快照
  addSnapshot(snapshot) {
    if (!this.data.snapshots) this.data.snapshots = [];
    this.data.snapshots.unshift({
      id: 'snp_' + Date.now(),
      timestamp: new Date().toISOString(),
      ...snapshot
    });
    // 保留最近 20 条
    if (this.data.snapshots.length > 20) {
      this.data.snapshots = this.data.snapshots.slice(0, 20);
    }
    this.save();
  }
}

const storeInstance = new Store();
module.exports = storeInstance;
