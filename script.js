const form = document.getElementById("form");
const msg = document.getElementById("msg");
const result = document.getElementById("result");
const title = document.getElementById("title");
const thumb = document.getElementById("thumb");
const links = document.getElementById("links");
const button = document.getElementById("go");
const preview = document.getElementById("preview");
const siteIcon = document.getElementById("site-icon");
const siteName = document.getElementById("site-name");
const siteFrame = document.getElementById("site-frame");
const siteShot = document.getElementById("site-shot");
const siteFallback = document.getElementById("site-fallback");
const siteLink = document.getElementById("site-link");
const previewVideo = document.getElementById("preview-video");
const cornerDownload = document.getElementById("corner-download");
let requestId = 0;

function showMessage(text, kind) {
  msg.className = kind === "error"
    ? "mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-800"
    : "mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900";
  msg.textContent = text;
}

function youtubeId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || "";
    if (host.endsWith("youtube.com")) return parsed.searchParams.get("v") || "";
  } catch (error) {
    return "";
  }
  return "";
}

function vimeoId(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.replace(/^www\./, "").endsWith("vimeo.com")) return "";
    const part = parsed.pathname.split("/").filter(Boolean).pop() || "";
    return /^\d+$/.test(part) ? part : "";
  } catch (error) {
    return "";
  }
}

function isFile(url) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
}

function clearLayers() {
  siteFrame.classList.add("hidden");
  siteFrame.removeAttribute("src");
  siteShot.classList.add("hidden");
  siteShot.removeAttribute("src");
  siteFallback.classList.add("hidden");
  previewVideo.pause();
  previewVideo.removeAttribute("src");
  previewVideo.classList.add("hidden");
  previewVideo.load();
  links.innerHTML = "";
  result.classList.add("hidden");
}

function showPreview(url, data) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    return;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  siteName.textContent = (data && data.site) || host;
  siteIcon.src = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(parsed.hostname) + "&sz=64";
  siteLink.textContent = (data && data.page) || url;
  clearLayers();

  const fileUrl = isFile(url) ? url : "";
  const yt = youtubeId(url);
  const vimeo = vimeoId(url);
  if (fileUrl) {
    previewVideo.src = fileUrl;
    previewVideo.classList.remove("hidden");
    previewVideo.play().catch(() => {});
  } else if (yt) {
    siteFrame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(yt);
    siteFrame.classList.remove("hidden");
  } else if (vimeo) {
    siteFrame.src = "https://player.vimeo.com/video/" + encodeURIComponent(vimeo);
    siteFrame.classList.remove("hidden");
  } else if (data && data.thumbnail) {
    siteShot.src = data.thumbnail;
    siteShot.classList.remove("hidden");
  } else {
    siteFrame.src = url;
    siteFrame.classList.remove("hidden");
  }

  preview.classList.remove("hidden");
  if (data && data.title) {
    title.textContent = data.title;
    result.classList.remove("hidden");
  }
  if (data && data.thumbnail) {
    thumb.src = data.thumbnail;
    thumb.classList.remove("hidden");
  }
}

async function readJson(response) {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return null;
  }
}

async function findFile(url) {
  if (isFile(url)) return url;
  try {
    const response = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
    const html = await response.text();
    const match = html.match(/https?:[^"'\\s>]+\.(mp4|webm|ogg|mov|m4v)(\?[^"'\\s>]*)?/i);
    return match ? match[0].replace(/&/g, "&") : "";
  } catch (error) {
    return "";
  }
}

async function downloadPlaying() {
  let src = previewVideo && !previewVideo.classList.contains("hidden") ? (previewVideo.currentSrc || previewVideo.src) : "";
  if (!src) {
    const page = document.getElementById("url").value.trim();
    src = await findFile(page);
    if (src) {
      previewVideo.src = src;
      previewVideo.classList.remove("hidden");
      siteFrame.classList.add("hidden");
      previewVideo.play().catch(() => {});
    }
  }
  if (!src) {
    showMessage("No video file was found to save from the playing preview.", "error");
    return;
  }
  const name = (src.split("/").pop().split("?")[0] || "video.mp4").replace(/[^A-Za-z0-9._-]/g, "") || "video.mp4";
  cornerDownload.disabled = true;
  cornerDownload.textContent = "Saving...";
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error("blocked");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    showMessage("The video file is saving to your computer, usually in Downloads.", "ok");
  } catch (error) {
    const link = document.createElement("a");
    link.href = src;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showMessage("Your browser is saving the video file to your computer.", "ok");
  } finally {
    cornerDownload.disabled = false;
    cornerDownload.textContent = "Download";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = document.getElementById("url").value.trim();
  const current = ++requestId;
  button.disabled = true;
  button.textContent = "Looking...";
  showPreview(url);
  showMessage(isFile(url) ? "Video is playing. Use Download in the corner to save it." : "Loading a preview of the source website...", "ok");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const previewResponse = await fetch("https://noembed.com/embed?url=" + encodeURIComponent(url), {signal: controller.signal});
    const previewData = await readJson(previewResponse);
    if (current !== requestId) return;
    if (previewData && !previewData.error) {
      showPreview(url, {
        site: previewData.provider_name,
        page: previewData.url || url,
        title: previewData.title,
        thumbnail: previewData.thumbnail_url
      });
    }
    if (isFile(url)) showMessage("Video is playing. Use Download in the corner to save it.", "ok");
    else showMessage("Preview is ready. A direct video file can be saved while it plays.", "ok");
  } catch (error) {
    if (current === requestId && isFile(url)) showMessage("Video is playing. Use Download in the corner to save it.", "ok");
  } finally {
    clearTimeout(timer);
    if (current === requestId) {
      button.disabled = false;
      button.textContent = "Find download";
    }
  }
});

cornerDownload.addEventListener("click", downloadPlaying);
