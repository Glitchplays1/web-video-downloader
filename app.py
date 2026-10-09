"""Simple local web form that downloads one video you have the right to save."""

import os
import re
import tempfile
from pathlib import Path

from flask import Flask, render_template, request, send_file
from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

MAX_BYTES = 500 * 1024 * 1024
SAFE_NAME = re.compile(r"[^A-Za-z0-9._ -]+")


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
        fmt = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
        merge = "mp4"

    with tempfile.TemporaryDirectory(prefix="viddl-") as folder:
        opts = {
            "outtmpl": os.path.join(folder, "%(title).80s.%(ext)s"),
            "format": fmt,
            "noplaylist": True,
            "restrictfilenames": True,
            "quiet": True,
            "no_warnings": True,
            "max_filesize": MAX_BYTES,
            "socket_timeout": 30,
        }
        if merge:
            opts["merge_output_format"] = merge

        try:
            with YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
        except DownloadError as exc:
            return render_template("index.html", error=f"Could not download that link: {exc}"), 400
        except Exception as exc:  # noqa: BLE001 — show a short message, not a crash page
            return render_template("index.html", error=f"Something went wrong: {exc}"), 500

        files = [p for p in Path(folder).iterdir() if p.is_file()]
        if not files:
            return render_template("index.html", error="No file was saved. The video may be too large or unavailable."), 400

        saved = max(files, key=lambda p: p.stat().st_size)
        if saved.stat().st_size > MAX_BYTES:
            return render_template("index.html", error="That file is over the 500 MB limit."), 400

        title = clean_name((info or {}).get("title") or saved.stem)
        download_name = f"{title}{saved.suffix}"
        return send_file(saved, as_attachment=True, download_name=download_name)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
