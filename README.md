# AIContextShare - 多 AI 工具与多账号上下文共享胶囊

> 针对 **浏览器网页端** 与 **桌面客户端（workbuddy、codebuddy、Antigravity 等）** 的全域通用上下文便携底座。
> 一键将项目背景、技术栈规范、已达成共识与本轮待办打包成高密度“上下文胶囊”，跨工具、跨账号随取随用，告别重复输入提示词与重新训导。

---

## 🌟 核心特性与解决的痛点

1. **三层金字塔上下文模型**：
   * **L1 全局偏好 (Global Profile)**：设定您的通用角色（如资深架构师）、语言偏好、回答格式约束（拒绝废话客套）。
   * **L2 项目底座 (Project Anchor)**：设定各独立项目的固定技术栈、业务规范与硬性约束。
   * **L3 阶段任务接力 (Task Capsule)**：记录上一轮讨论产出的最新结论与本轮核心待办，随取随切。
2. **全域全软件无缝穿透**：
   * **桌面端与客户端**：不论当前焦点在 `workbuddy`、`codebuddy`、`Antigravity` 还是本地 IDE，按下全局快捷键即可一键贴入。
   * **浏览器网页端**：已全面适配 `ChatGPT`、`Claude`、`DeepSeek`、`Kimi`、`豆包`、`通义千问`、`Gemini` 等各大主流网页。
3. **极简极速键盘操作（Raycast / Spotlight 风格）**：
   * <kbd>Alt + C</kbd>：全局瞬间呼出 / 收起毛玻璃悬浮胶囊；
   * <kbd>Enter</kbd>：一键注入并自动模拟粘贴到当前光标所在输入框；
   * <kbd>Alt + S</kbd>：划词吸取——在任意软件复制结论后，按此键瞬间存为当前项目最新进展；
   * <kbd>Esc</kbd>：快速收起隐藏。
4. **100% 本地离线隐私安全**：
   * 所有配置、项目背景均保存在本地 `data/context_store.json`；
   * 零外部依赖、零 API 成本、纯离线运行，支持一键备份与导出。
5. **配套 Chrome / Edge 扩展插件**：
   * 附带 Manifest V3 扩展，在浏览器内可直接与本地服务联动。

---

## 🚀 快速启动使用

### 1. 启动桌面悬浮小工具

在项目目录下执行：

```powershell
npm start
```

* 启动后，桌面右下角系统托盘将常驻小图标；
* 屏幕中央将弹出高颜值暗黑毛玻璃主面板；
* 在任何软件中按下 <kbd>Alt + C</kbd> 即可随时呼出。

### 2. （可选）安装浏览器插件助手

1. 打开 Chrome 或 Edge 浏览器，访问：`chrome://extensions/`；
2. 开启右上角的 **“开发者模式” (Developer mode)**；
3. 点击 **“加载已解压的扩展程序” (Load unpacked)**；
4. 选择本项目中的 `d:\traes\AIContextShare\browser_extension` 文件夹即可。

---

## 💡 典型跨工具交接场景工作流

假设您当前在推进一个新功能：

1. **第一步（在 Claude 讨论方案）**：
   * 讨论完成后，选中 Claude 给出的关键设计，复制并按下 <kbd>Alt + S</kbd>（已自动将此结论存为当前项目最新进展）；
2. **第二步（切换到 DeepSeek 或 ChatGPT 审计逻辑）**：
   * 打开 DeepSeek 网页，点击输入框；
   * 按下 <kbd>Alt + C</kbd> 呼出胶囊面板，切换到“DeepSeek推理”风格，按下 <kbd>Enter</kbd>；
   * 面板自动隐去，并自动将结构化上下文贴入输入框中，DeepSeek 瞬间获知前序进展！
3. **第三步（切换到桌面端 codebuddy / workbuddy / Antigravity 编码）**：
   * 切换到桌面编程工具，在对话框内按下 <kbd>Alt + C</kbd> -> <kbd>Enter</kbd>，直接无缝继续写代码。

---

## 🛠️ 项目目录结构

```
d:\traes\AIContextShare\
├── package.json
├── README.md
├── src\
│   ├── main.js              // Electron 主进程：窗口管理、全局快捷键、托盘、IPC 通信
│   ├── preload.js           // 安全渲染进程桥梁
│   ├── store.js             // 本地数据持久化 (CRUD、划词捕获、快照归档)
│   ├── server.js            // 本地 HTTP API 网关 (供浏览器扩展与外部集成)
│   └── utils\
│       ├── injector.js      // 剪贴板管理与 Windows 自动粘贴模拟
│       └── promptBuilder.js // 上下文分层组装引擎
├── ui\
│   ├── index.html           // 悬浮主界面 + 设置模态框
│   ├── index.css            // 现代化毛玻璃暗黑科技风格样式
│   └── app.js               // UI 响应式状态管理、键盘快捷键处理
├── browser_extension\        // 配套 Chrome / Edge 扩展程序
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── content.js           // AI 网页输入框自动识别与注入
└── data\                    // 本地存储目录 (自动生成 context_store.json)
```

---

## 🛡️ 快捷键速查表

| 快捷键 | 功能说明 | 适用场景 |
| :--- | :--- | :--- |
| <kbd>Alt + C</kbd> | 呼出 / 隐藏上下文胶囊悬浮面板 | 全局任意软件窗口 |
| <kbd>Enter</kbd> | 注入当前组装好的 Prompt 并自动粘贴 | 胶囊面板激活时 |
| <kbd>Alt + S</kbd> | 捕获剪贴板文本并追加为最新进展 | 全局任意软件窗口 |
| <kbd>Esc</kbd> | 快速收起/隐藏面板 | 胶囊面板激活时 |
| <kbd>Ctrl + Enter</kbd> | 强制触发注入并粘贴 | 编辑多行文本框时 |
