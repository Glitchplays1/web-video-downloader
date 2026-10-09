# Web Video Downloader

A small web form that saves a video from a link you paste in. It runs on your computer and uses [yt-dlp](https://github.com/yt-dlp/yt-dlp).

**Only download videos you made, own, or have permission to save.** Respect copyright and each site's rules. This project does not bypass paywalls or copy protection.

## What you need

- Python 3.10 or newer
- FFmpeg (used to join video and audio into one file)

Install FFmpeg:

- Windows: `winget install Gyan.FFmpeg`
- macOS: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg`

## Run it

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000 , paste a video link, and click Download.

The app only accepts one video at a time (playlists are skipped) and refuses files larger than 500 MB.

## Files

- `app.py` — Flask server
- `templates/index.html` — the form page
- `requirements.txt` — Python packages
