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

function pageShot(url) {
  return "https://s.wordpress.com/mshots/v1/" + encodeURIComponent(url) + "?w=1000";
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
  siteFallback.classList.add("hidden");
  siteFrame.classList.add("hidden");
  siteFrame.removeAttribute("src");

  siteShot.alt = "Preview of " + host;
  siteShot.src = pageShot(url);
  siteShot.classList.remove("hidden");
  siteShot.onerror = function () {
    siteShot.onerror = null;
    siteShot.src = "https://image.thum.io/get/width/1000/noanimate/" + url;
  };

  const yt = youtubeId(url);
  const vimeo = vimeoId(url);
  if (yt) {
    siteFrame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(yt);
    siteFrame.classList.remove("hidden");
  } else if (vimeo) {
    siteFrame.src = "https://player.vimeo.com/video/" + encodeURIComponent(vimeo);
    siteFrame.classList.remove("hidden");
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
      showMessage("Preview of " + (previewData.provider_name || parsedHost(url)) + " is ready.", "ok");
    } else {
      showMessage("Preview of the source website is ready.", "ok");
    }
  } catch (error) {
    showMessage("Preview of the source website is ready.", "ok");
  } finally {
    button.disabled = false;
    button.textContent = "Find download";
  }
});

function parsedHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return "the source website";
  }
}
