@echo off
cd /d "%~dp0\..\.."
set "CRM_PYTHON=D:\ComfyUI_windows_portable\python_embeded\python.exe"
if exist "%CRM_PYTHON%" goto run
set /p "CRM_PYTHON=Full path to ComfyUI python.exe: "
if not exist "%CRM_PYTHON%" (
  echo Python not found. See LOCAL-PORTRAITS.md
  pause
  exit /b 1
)
:run
echo Open http://127.0.0.1:4175 in your browser.
"%CRM_PYTHON%" scripts\local-portraits\server.py --jobs-dir D:\CRMPhoto\jobs
pause
