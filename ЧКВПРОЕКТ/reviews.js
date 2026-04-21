// reviews.js
document.addEventListener("DOMContentLoaded", () => {
  const starsWrap = document.getElementById("stars");
  const sendBtn = document.getElementById("sendReview");
  const textEl = document.getElementById("reviewText");
  const out = document.getElementById("reviewOut");

  if (!starsWrap || !sendBtn || !textEl || !out) return;

  let rating = 0;

  function paint() {
    starsWrap.querySelectorAll(".star").forEach(b => {
      const v = Number(b.dataset.v);
      b.classList.toggle("on", v <= rating);
    });
  }

  starsWrap.querySelectorAll(".star").forEach(btn => {
    btn.addEventListener("click", () => {
      rating = Number(btn.dataset.v);
      paint();
    });
  });

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }
  function save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function downloadJSON(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  sendBtn.addEventListener("click", () => {
    const text = textEl.value.trim();

    if (rating === 0) {
      out.textContent = "⚠️ Алдымен 1–5 ⭐ таңдаңыз.";
      return;
    }
    if (text.length < 2) {
      out.textContent = "⚠️ Пікір жазыңыз (кемі 2 әріп).";
      return;
    }

    // Кім жіберді? (кіру болса — аты/логині)
    const currentUser = load("jl_current_user", null);

    const item = {
      stars: rating,
      text,
      by: currentUser?.login || "guest",
      createdAt: new Date().toISOString()
    };

    const list = load("jl_reviews", []);
    list.push(item);
    save("jl_reviews", list);

    // ✅ Автоматты түрде reviews.json жүктеу
    downloadJSON("reviews.json", { items: list, exportedAt: new Date().toISOString() });

    out.textContent = "✅ Жіберілді! reviews.json жүктелді.";
    textEl.value = "";
    rating = 0;
    paint();
  });
});