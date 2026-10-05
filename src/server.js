const http = require('http');
const store = require('./store');
const { buildContextPrompt } = require('./utils/promptBuilder');
const { injectToActiveWindow } = require('./utils/injector');

const DEFAULT_PORT = 39281;

function startServer(port = DEFAULT_PORT) {
  const server = http.createServer((req, res) => {
    // 允许跨域（方便浏览器页面脚本/扩展调用）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://localhost:${port}`);
    const pathname = parsedUrl.pathname;

    const sendJson = (statusCode, data) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };

    // 路由分发
    if (req.method === 'GET' && pathname === '/api/status') {
      return sendJson(200, { status: 'running', port, version: '1.0.0' });
    }

    if (req.method === 'GET' && pathname === '/api/context') {
      const allData = store.getAll();
      const activeProject = store.getActiveProject();
      const prompt = buildContextPrompt({
        project: activeProject,
        persona: allData.globalPersona,
        targetPlatform: allData.targetPlatform
      });
      return sendJson(200, {
        activeProject,
        targetPlatform: allData.targetPlatform,
        prompt,
        projects: allData.projects.map(p => ({ id: p.id, name: p.name }))
      });
    }

    if (req.method === 'GET' && pathname === '/api/store') {
      return sendJson(200, store.getAll());
    }

    // 处理 POST 请求 body
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        let payload = {};
        try {
          if (body) payload = JSON.parse(body);
        } catch (e) {
          return sendJson(400, { error: 'Invalid JSON body' });
        }

        if (pathname === '/api/capture') {
          const { text, mode } = payload;
          const success = store.captureToConsensus(text, mode || 'append');
          return sendJson(200, { success, message: success ? '捕获成功' : '捕获失败或内容为空' });
        }

        if (pathname === '/api/inject') {
          const { text, autoPaste } = payload;
          const allData = store.getAll();
          const contentToInject = text || buildContextPrompt({
            project: store.getActiveProject(),
            persona: allData.globalPersona,
            targetPlatform: allData.targetPlatform
          });
          const result = await injectToActiveWindow(contentToInject, autoPaste !== undefined ? autoPaste : allData.autoPaste);
          store.addSnapshot({
            projectName: store.getActiveProject()?.name,
            platform: allData.targetPlatform,
            contentPreview: contentToInject.slice(0, 100) + '...'
          });
          return sendJson(200, result);
        }

        if (pathname === '/api/project/active') {
          const { projectId } = payload;
          const success = store.setActiveProject(projectId);
          return sendJson(200, { success });
        }

        if (pathname === '/api/store') {
          const success = store.save(payload);
          return sendJson(200, { success });
        }

        return sendJson(404, { error: 'Not Found' });
      });
      return;
    }

    sendJson(404, { error: 'Not Found' });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Local Server] 端口 ${port} 被占用，尝试 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Local Server] 启动异常:', err);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[Local Server] 本地上下文网关服务已启动在 http://127.0.0.1:${port}`);
  });

  return server;
}

module.exports = {
  startServer,
  DEFAULT_PORT
};
