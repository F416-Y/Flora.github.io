@echo off
cd /d "%~dp0"
title Flora's Space 留言板服务
echo ========================================
echo    Flora's Space 留言板服务启动中...
echo ========================================
echo.
start http://localhost:3001
node guestbook-server.js
pause
