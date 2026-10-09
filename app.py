"""Local web form that downloads one video you have the right to save."""

import os
import re
import shutil
import tempfile
import uuid
from pathlib import Path

from flask import Flask, after_this_request, render_template, request, send_file
from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

MAX_BYTES = 500 * 1024 * 1024
SAFE_NAME = re.compile(r"[^A-Za-z0-9._ -]+")
OUT_DIR = Path(tempfile.gettempdir()) / "web-video-downloader"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def clean_name(name: str) -> str:
    name = SAFE_NAME.sub("", name).strip(" .")
    return name[:80] or "video"


@app.get("/")
def home():
    return render_template("index.html")


@app.post("/download")
def download():
    url = (request.form.get("url") or "").strip()
    mode = request.form.get("mode") or "video"
    if not url.startswith(("http://", "https://")):
        return render_template("index.html", error="Paste a full link that starts with http:// or https://."), 400

    if mode == "audio":
        fmt = "bestaudio/best"
        merge = None
    else:
        fmt = "best[ext=mp4]/best"
        merge = "mp4"

    work = OUT_DIR / uuid.uuid4().hex
    work.mkdir(parents=True, exist_ok=True)
    opts = {
        "outtmpl": str(work / "%(title).80s.%(ext)s"),
        "format": fmt,
        "noplaylist": True,
        "restrictfilenames": True,
        "quiet": True,
        "no_warnings": True,
        "max_filesize": MAX_BYTES,
        "socket_timeout": 30,
        "retries": 3,
    }
    if merge:
        opts["merge_output_format"] = merge

    try:
        with YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except DownloadError as exc:
        shutil.rmtree(work, ignore_errors=True)
        text = str(exc)
        if "ffmpeg" in text.lower():
            text = "FFmpeg is missing. Install it, then try again."
        return render_template("index.html", error=f"Could not download that link: {text}"), 400
    except Exception as exc:  # noqa: BLE001
        shutil.rmtree(work, ignore_errors=True)
        return render_template("index.html", error=f"Something went wrong: {exc}"), 500

    files = [p for p in work.iterdir() if p.is_file()]
    if not files:
        shutil.rmtree(work, ignore_errors=True)
        return render_template("index.html", error="No file was saved. The video may be too large or unavailable."), 400

    saved = max(files, key=lambda p: p.stat().st_size)
    if saved.stat().st_size > MAX_BYTES:
        shutil.rmtree(work, ignore_errors=True)
        return render_template("index.html", error="That file is over the 500 MB limit."), 400

    title = clean_name((info or {}).get("title") or saved.stem)
    download_name = f"{title}{saved.suffix}"

    @after_this_request
    def cleanup(response):
        shutil.rmtree(work, ignore_errors=True)
        return response

    return send_file(saved, as_attachment=True, download_name=download_name)


if __name__ == "__main__":
    print("Open http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
