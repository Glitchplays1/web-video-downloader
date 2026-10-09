# Web Video Downloader

Live page: https://glitchplays1.github.io/web-video-downloader/

GitHub Pages can only show a website. It cannot save videos from YouTube and most other sites, because those sites block browsers. The computer app below does that part.

Only save videos you made or have permission to save.

## Run the downloader on your computer

1. Install Python from https://www.python.org/downloads/ (check "Add Python to PATH").
2. Install FFmpeg: `winget install Gyan.FFmpeg`
3. Double-click `run.bat`.
4. Open http://127.0.0.1:5000 and paste a video link.

On Mac or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
