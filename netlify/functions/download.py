import json


def handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}

    url = str(body.get("url") or "").strip()
    if not url.startswith(("http://", "https://")) or len(url) > 2000:
        return _resp(400, {"error": "Paste a full link that starts with http:// or https://."})

    try:
        from yt_dlp import YoutubeDL
        from yt_dlp.utils import DownloadError
    except Exception:
        return _resp(500, {"error": "The downloader is still installing. Wait a minute and try again."})

    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "socket_timeout": 20,
        "skip_download": True,
    }
    try:
        with YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False) or {}
    except DownloadError:
        return _resp(400, {"error": "Could not read that link. Only save videos you have permission to save."})
    except Exception:
        return _resp(400, {"error": "Could not read that link."})

    formats = []
    for item in info.get("formats") or []:
        link = item.get("url") or ""
        if not link.startswith("http"):
            continue
        ext = item.get("ext") or "file"
        height = item.get("height")
        vcodec = item.get("vcodec")
        acodec = item.get("acodec")
        if vcodec and vcodec != "none" and height:
            label = f"{height}p {ext}"
        elif acodec and acodec != "none":
            label = f"Audio {ext}"
        else:
            continue
        formats.append({"label": label, "url": link, "ext": ext})

    unique = {}
    for item in formats:
        unique[item["label"]] = item
    formats = list(unique.values())[-8:]
    if not formats and str(info.get("url") or "").startswith("http"):
        formats = [{"label": "Best file", "url": info["url"], "ext": info.get("ext") or "mp4"}]
    if not formats:
        return _resp(400, {"error": "No downloadable file was found for that link."})

    return _resp(200, {
        "title": info.get("title") or "Video",
        "thumbnail": info.get("thumbnail") or "",
        "site": info.get("extractor") or "",
        "page": info.get("webpage_url") or url,
        "formats": formats,
    })


def _resp(code, payload):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }
