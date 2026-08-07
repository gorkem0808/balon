@echo off
cd /d "%~dp0.."
if not exist node_modules (
  echo Ilk kurulum: npm install
  npm install
)
npm start
pause
