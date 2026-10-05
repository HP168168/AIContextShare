const { clipboard } = require('electron');
const { exec } = require('child_process');

/**
 * 注入上下文到当前前台应用窗口
 * @param {string} text 要注入的文本内容
 * @param {boolean} autoPaste 是否自动模拟 Ctrl+V
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function injectToActiveWindow(text, autoPaste = true) {
  if (!text) {
    return { success: false, error: '注入内容为空' };
  }

  // 1. 先写入系统剪贴板
  clipboard.writeText(text);

  if (!autoPaste) {
    return { success: true, message: '已复制到剪贴板' };
  }

  // 2. Windows 平台模拟 Ctrl+V 粘贴
  // 先留出 120ms 延时，确保 Electron 窗口隐藏后，系统焦点平滑恢复到上一个窗口（浏览器或桌面客户端）
  return new Promise((resolve) => {
    setTimeout(() => {
      const psCommand = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`;
      exec(psCommand, (err) => {
        if (err) {
          console.warn('[Injector] 自动粘贴模拟警告 (内容仍在剪贴板中):', err.message);
          resolve({ success: true, message: '已复制到剪贴板，请手动 Ctrl+V 粘贴' });
        } else {
          resolve({ success: true, message: '已自动注入到当前输入框' });
        }
      });
    }, 120);
  });
}

module.exports = {
  injectToActiveWindow
};
