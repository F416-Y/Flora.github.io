@echo off
cd /d "%~dp0"
echo 正在启动 Flora's Space 留言板服务...
start http://localhost:3001
node guestbook-server.js
pause
