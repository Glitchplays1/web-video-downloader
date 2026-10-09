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
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      return parsed.searchParams.get("v") || "";
    }
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
  siteFrame.classList.add("hidden");
  siteShot.classList.add("hidden");
  siteFallback.classList.add("hidden");
  siteFrame.removeAttribute("src");

  const yt = youtubeId(url);
  const vimeo = vimeoId(url);
  if (yt) {
    siteFrame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(yt);
    siteFrame.classList.remove("hidden");
  } else if (vimeo) {
    siteFrame.src = "https://player.vimeo.com/video/" + encodeURIComponent(vimeo);
    siteFrame.classList.remove("hidden");
  } else if (data && data.thumbnail) {
    siteShot.src = data.thumbnail;
    siteShot.classList.remove("hidden");
  } else {
    siteFallback.textContent = "Preview of " + host + ".";
    siteFallback.classList.remove("hidden");
  }
  preview.classList.remove("hidden");
  if (data && data.title) title.textContent = data.title;
  if (data && data.thumbnail) {
    thumb.src = data.thumbnail;
    thumb.classList.remove("hidden");
    result.classList.remove("hidden");
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = document.getElementById("url").value.trim();
  result.classList.add("hidden");
  links.innerHTML = "";
  button.disabled = true;
  button.textContent = "Looking...";
  showPreview(url);
  showMessage("Loading a preview of the source website...", "ok");

  try {
    const previewResponse = await fetch("https://noembed.com/embed?url=" + encodeURIComponent(url));
    const previewData = await readJson(previewResponse);
    if (previewData && !previewData.error) {
      showPreview(url, {
        site: previewData.provider_name,
        page: previewData.url || url,
        title: previewData.title,
        thumbnail: previewData.thumbnail_url
      });
      showMessage("Preview loaded from " + (previewData.provider_name || "the source website") + ".", "ok");
    } else {
      showMessage("Preview loaded from the source website.", "ok");
    }
  } catch (error) {
    showMessage("Preview loaded from the source website.", "ok");
  } finally {
    button.disabled = false;
    button.textContent = "Find download";
  }
});
