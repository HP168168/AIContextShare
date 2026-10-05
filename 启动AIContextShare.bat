@echo off
chcp 65001 >nul
title AIContextShare - 启动中...

echo ==============================================
echo   AIContextShare 上下文胶囊正在启动...
echo   快捷键：Alt + C 呼出/隐藏面板
echo   快捷键：Alt + S 划词吸取剪贴板
echo ==============================================

cd /d "%~dp0"
npm start
