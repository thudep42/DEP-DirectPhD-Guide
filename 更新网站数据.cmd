@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update-local.ps1" %*
if errorlevel 1 (echo 更新失败，请查看上方说明。) else (echo 数据更新完成。)
pause
