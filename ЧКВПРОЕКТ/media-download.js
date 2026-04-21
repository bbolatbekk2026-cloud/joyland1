document.addEventListener("DOMContentLoaded", () => {
  // Біреуін жүктеу
  document.querySelectorAll(".dlMedia").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const url = getCardMediaUrl(btn);
      if (!url) return alert("Файл табылмады");

      try {
        await forceDownloadBlob(url);
      } catch (err) {
        alert(
          "Жүктеу бұғатталды немесе сайт file:// арқылы ашылған.\n" +
          "✅ Шешім: VS Code → Live Server арқылы ашып көр."
        );
      }
    });
  });

  // Барлығын жүктеу
  const allBtn = document.getElementById("downloadAllMedia");
  if (allBtn) {
    allBtn.addEventListener("click", async () => {
      const urls = [];
      document.querySelectorAll(".media-card").forEach((card) => {
        const img = card.querySelector("img");
        const source = card.querySelector("source");
        const video = card.querySelector("video");

        if (img?.getAttribute("src")) urls.push(img.getAttribute("src"));
        else if (video?.getAttribute("src")) urls.push(video.getAttribute("src"));
        else if (source?.getAttribute("src")) urls.push(source.getAttribute("src"));
      });

      if (!urls.length) return alert("Файл табылмады");

      try {
        for (const url of urls) {
          await forceDownloadBlob(url);
          await wait(350); // браузер блоктамасын
        }
      } catch (err) {
        alert(
          "Жүктеу бұғатталды немесе сайт file:// арқылы ашылған.\n" +
          "✅ Шешім: VS Code → Live Server арқылы аш."
        );
      }
    });
  }
});

function getCardMediaUrl(btn) {
  const card = btn.closest(".media-card");
  if (!card) return "";

  const img = card.querySelector("img");
  const video = card.querySelector("video");
  const source = card.querySelector("source");

  if (img?.getAttribute("src")) return img.getAttribute("src");
  if (video?.getAttribute("src")) return video.getAttribute("src");
  if (source?.getAttribute("src")) return source.getAttribute("src");

  return "";
}

// 100% ашпайды: fetch -> blob -> download
async function forceDownloadBlob(fileUrl) {
  const res = await fetch(fileUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch failed: " + res.status);

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;

  const filename = (fileUrl.split("/").pop() || "download").split("?")[0];
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}