const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('./store');
const { startServer } = require('./server');
const { injectToActiveWindow } = require('./utils/injector');

let mainWindow = null;
let tray = null;

// 创建应用主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    minWidth: 800,
    minHeight: 520,
    frame: false,
    transparent: true,
    show: false,
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'ui', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 失焦处理：仅当不是总是置顶且未锁定窗口时自动隐藏（可在UI配置）
  mainWindow.on('blur', () => {
    // 默认保持，避免用户点击外部导致意外关闭；回车注入时会主动隐藏
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 切换窗口显隐
function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('window:shown');
  }
}

// 注册全局快捷键
function registerShortcuts() {
  // Alt+C 呼出/隐藏面板
  const registeredC = globalShortcut.register('Alt+C', () => {
    toggleWindow();
  });

  if (!registeredC) {
    console.warn('[Shortcut] Alt+C 注册失败，尝试 Ctrl+Alt+C');
    globalShortcut.register('CommandOrControl+Alt+C', () => {
      toggleWindow();
    });
  }

  // Alt+S 一键抓取剪贴板内容到当前活跃项目的阶段结论
  const registeredS = globalShortcut.register('Alt+S', () => {
    const text = clipboard.readText();
    if (text && text.trim()) {
      const activeProject = store.getActiveProject();
      const success = store.captureToConsensus(text, 'append');
      if (success && mainWindow) {
        mainWindow.webContents.send('notify:capture', {
          projectName: activeProject?.name,
          capturedText: text.trim().slice(0, 80)
        });
      }
    }
  });

  if (!registeredS) {
    globalShortcut.register('CommandOrControl+Alt+S', () => {
      const text = clipboard.readText();
      if (text && text.trim()) {
        store.captureToConsensus(text, 'append');
      }
    });
  }
}

// 创建系统托盘
function createTray() {
  // 生成一个优雅的小图标 (16x16 RGBA buffer)
  const iconSize = 16;
  const iconBuffer = Buffer.alloc(iconSize * iconSize * 4);
  for (let i = 0; i < iconSize * iconSize; i++) {
    // 柔和靛蓝/青紫色
    iconBuffer[i * 4] = 99;     // R
    iconBuffer[i * 4 + 1] = 102; // G
    iconBuffer[i * 4 + 2] = 241; // B
    iconBuffer[i * 4 + 3] = 255; // A
  }
  const trayIcon = nativeImage.createFromBuffer(iconBuffer, { width: iconSize, height: iconSize });
  
  tray = new Tray(trayIcon);
  tray.setToolTip('AIContextShare - 上下文胶囊 (Alt+C 呼出)');

  const updateTrayMenu = () => {
    const data = store.getAll();
    const projectSubmenus = data.projects.map(p => ({
      label: p.name,
      type: 'radio',
      checked: p.id === data.activeProjectId,
      click: () => {
        store.setActiveProject(p.id);
        if (mainWindow) mainWindow.webContents.send('window:shown');
      }
    }));

    const contextMenu = Menu.buildFromTemplate([
      { label: '呼出/隐藏胶囊面板 (Alt+C)', click: toggleWindow },
      { label: '抓取剪贴板到结论 (Alt+S)', click: () => {
          const text = clipboard.readText();
          if (text) store.captureToConsensus(text, 'append');
        }
      },
      { type: 'separator' },
      { label: '切换当前工作项目', submenu: projectSubmenus },
      { type: 'separator' },
      { label: '退出 AIContextShare', click: () => app.quit() }
    ]);

    tray.setContextMenu(contextMenu);
  };

  updateTrayMenu();
  tray.on('click', toggleWindow);
}

// 注册 IPC 通信
function setupIPC() {
  ipcMain.handle('store:get-all', () => store.getAll());
  
  ipcMain.handle('store:save-all', (e, data) => store.save(data));
  
  ipcMain.handle('store:set-active-project', (e, id) => store.setActiveProject(id));
  
  ipcMain.handle('store:update-project', (e, proj) => store.updateProject(proj));
  
  ipcMain.handle('store:delete-project', (e, id) => store.deleteProject(id));
  
  ipcMain.handle('store:capture-text', (e, text, mode) => store.captureToConsensus(text, mode));

  ipcMain.handle('action:inject', async (e, text, autoPaste) => {
    // 1. 隐藏窗口让焦点回到之前的输入框
    if (mainWindow) {
      mainWindow.hide();
    }
    // 2. 注入文本
    const result = await injectToActiveWindow(text, autoPaste);
    // 3. 记录快照
    const allData = store.getAll();
    store.addSnapshot({
      projectName: store.getActiveProject()?.name,
      platform: allData.targetPlatform,
      contentPreview: text.slice(0, 100) + '...'
    });
    return result;
  });

  ipcMain.handle('action:copy', (e, text) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('window:hide', () => {
    if (mainWindow) mainWindow.hide();
  });

  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  // 导出 JSON
  ipcMain.handle('store:export', async () => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '导出 AIContextShare 配置文件',
      defaultPath: 'AIContextShare_Backup.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(store.getAll(), null, 2), 'utf-8');
      return { success: true, filePath };
    }
    return { success: false };
  });

  // 导入 JSON
  ipcMain.handle('store:import', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: '导入 AIContextShare 配置文件',
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (filePaths && filePaths[0]) {
      try {
        const raw = fs.readFileSync(filePaths[0], 'utf-8');
        const parsed = JSON.parse(raw);
        store.save(parsed);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false };
  });
}

// 应用就绪生命周期
app.whenReady().then(() => {
  setupIPC();
  createWindow();
  registerShortcuts();
  createTray();
  startServer(); // 启动本地轻量 HTTP 网关

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
