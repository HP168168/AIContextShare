const API_BASE = 'http://127.0.0.1:39281';

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const curProject = document.getElementById('curProject');
const curTodo = document.getElementById('curTodo');
const btnInjectWeb = document.getElementById('btnInjectWeb');
const btnCaptureSelected = document.getElementById('btnCaptureSelected');

let currentContext = null;

async function checkStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/context`);
    if (res.ok) {
      currentContext = await res.json();
      statusDot.classList.remove('offline');
      statusText.textContent = '已连接服务';
      curProject.textContent = currentContext.activeProject?.name || '默认项目';
      curTodo.textContent = currentContext.activeProject?.current_task?.todo || '（无待办）';
    } else {
      throw new Error('Server status error');
    }
  } catch (err) {
    statusDot.classList.add('offline');
    statusText.textContent = '服务离线';
    curProject.textContent = '未启动本地服务';
    curTodo.textContent = '请先运行 npm start 启动桌面端';
    btnInjectWeb.disabled = true;
    btnCaptureSelected.disabled = true;
  }
}

// 填入当前网页输入框
btnInjectWeb.addEventListener('click', async () => {
  if (!currentContext || !currentContext.prompt) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'inject_prompt',
      prompt: currentContext.prompt
    }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        // 降级复制到剪贴板
        navigator.clipboard.writeText(currentContext.prompt);
        btnInjectWeb.textContent = '已复制到剪贴板 (请Ctrl+V)';
      } else {
        btnInjectWeb.textContent = '✅ 已成功填入！';
      }
      setTimeout(() => {
        btnInjectWeb.textContent = '⚡ 一键填入网页输入框';
      }, 1800);
    });
  }
});

// 吸取选中文本
btnCaptureSelected.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'get_selection' }, async (response) => {
      const selectedText = response?.text;
      if (selectedText && selectedText.trim()) {
        try {
          await fetch(`${API_BASE}/api/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: selectedText.trim(), mode: 'append' })
          });
          btnCaptureSelected.textContent = '✅ 已吸取为最新结论！';
          checkStatus();
        } catch (e) {
          btnCaptureSelected.textContent = '吸取失败';
        }
      } else {
        btnCaptureSelected.textContent = '未选中文本';
      }
      setTimeout(() => {
        btnCaptureSelected.textContent = '📌 吸取当前网页选中文本为最新结论';
      }, 1800);
    });
  }
});

checkStatus();
