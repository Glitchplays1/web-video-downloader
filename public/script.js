const form = document.getElementById("form");
const msg = document.getElementById("msg");
const result = document.getElementById("result");
const title = document.getElementById("title");
const thumb = document.getElementById("thumb");
const links = document.getElementById("links");
const button = document.getElementById("go");

function showMessage(text, kind) {
  msg.className = kind === "error"
    ? "mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-800"
    : "mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900";
  msg.textContent = text;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = document.getElementById("url").value.trim();
  result.classList.add("hidden");
  links.innerHTML = "";
  button.disabled = true;
  button.textContent = "Looking...";
  showMessage("Checking the link...", "ok");

  try {
    const response = await fetch("/api/download", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({url})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not read that link.");

    title.textContent = data.title;
    if (data.thumbnail) {
      thumb.src = data.thumbnail;
      thumb.classList.remove("hidden");
    } else {
      thumb.classList.add("hidden");
    }
    for (const format of data.formats) {
      const link = document.createElement("a");
      link.href = format.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = `Save ${format.label}`;
      link.className = "rounded-xl bg-stone-900 px-3 py-2 text-center text-sm font-bold text-white";
      links.appendChild(link);
    }
    result.classList.remove("hidden");
    showMessage("Choose a file. Open it soon, because some links expire.", "ok");
  } catch (error) {
    showMessage(error.message || "Something went wrong.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Find download";
  }
});
