/**
 * AIContextShare - Content Script
 * 适配 ChatGPT, Claude, DeepSeek, Kimi, 豆包, 通义千问, Gemini 等网页
 */

console.log('[AIContextShare] 插件脚本已载入当前 AI 页面');

// 监听 Popup 消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_selection') {
    const text = window.getSelection().toString();
    sendResponse({ text });
    return true;
  }

  if (request.action === 'inject_prompt') {
    const success = injectTextToActiveInput(request.prompt);
    sendResponse({ success });
    return true;
  }
});

// 定位页面输入框并填入内容
function injectTextToActiveInput(text) {
  // 查找可能的目标输入框（适配各大 AI 平台）
  const selectors = [
    'textarea#prompt-textarea',                      // ChatGPT
    'div[contenteditable="true"].ProseMirror',       // Claude
    'textarea[placeholder*="输入"]',                 // 通用 textarea
    'textarea[placeholder*="Ask"]',
    'div[contenteditable="true"]',                   // 豆包, DeepSeek, Gemini, Kimi
    'textarea'
  ];

  let inputEl = null;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.offsetParent !== null) { // 可见元素
      inputEl = el;
      break;
    }
  }

  if (!inputEl) {
    console.warn('[AIContextShare] 未自动找到活动输入框');
    return false;
  }

  inputEl.focus();

  if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
    inputEl.value = text;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } else if (inputEl.isContentEditable) {
    // 针对 contenteditable (如 Claude, Gemini, Kimi)
    inputEl.innerHTML = '';
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      const p = document.createElement('p');
      p.textContent = line || ' ';
      inputEl.appendChild(p);
    });
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  return false;
}
