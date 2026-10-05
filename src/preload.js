const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Store 数据操作
  getStore: () => ipcRenderer.invoke('store:get-all'),
  saveStore: (data) => ipcRenderer.invoke('store:save-all', data),
  setActiveProject: (id) => ipcRenderer.invoke('store:set-active-project', id),
  updateProject: (project) => ipcRenderer.invoke('store:update-project', project),
  deleteProject: (id) => ipcRenderer.invoke('store:delete-project', id),
  captureText: (text, mode) => ipcRenderer.invoke('store:capture-text', text, mode),
  
  // 注入与窗口动作
  injectContext: (text, autoPaste) => ipcRenderer.invoke('action:inject', text, autoPaste),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  copyToClipboard: (text) => ipcRenderer.invoke('action:copy', text),
  
  // 导入导出
  exportData: () => ipcRenderer.invoke('store:export'),
  importData: () => ipcRenderer.invoke('store:import'),

  // 监听主进程事件
  onWindowShown: (callback) => ipcRenderer.on('window:shown', () => callback()),
  onCaptureNotify: (callback) => ipcRenderer.on('notify:capture', (event, data) => callback(data))
});
