@echo off
cd /d "%~dp0"
where python >nul 2>&1
if errorlevel 1 (
  echo Install Python from https://www.python.org/downloads/ and try again.
  pause
  exit /b 1
)
if not exist .venv python -m venv .venv
call .venv\Scripts\activate
python -m pip install -r requirements.txt
echo Open http://127.0.0.1:5000 in your browser.
python app.py
pause
