document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("joyland-theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "🌙";
  } else {
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {
      localStorage.setItem("joyland-theme", "light");
      themeToggle.textContent = "🌙";
    } else {
      localStorage.setItem("joyland-theme", "dark");
      themeToggle.textContent = "☀️";
    }
  });
});

// Пайдаланушы мәліметтерін серверден алу
async function loadUser() {
  const profileWrap = document.getElementById("profileWrap");
  const authLink = document.getElementById("authLink");
  const profileName = document.getElementById("profileName");

  try {
    const res = await fetch("http://127.0.0.1:5000/api/me", { credentials: "include" });
    const data = await res.json();

    if (res.ok && data.ok) {
      // Пайдаланушы кірген болса
      profileWrap.style.display = "block";
      authLink.style.display = "none";
      profileName.textContent = data.user.username;
    } else {
      // Кірмеген болса
      profileWrap.style.display = "none";
      authLink.style.display = "inline-flex";
    }
  } catch (err) {
    console.error("Auth check failed:", err);
  }
}

// Профиль мәзірін ашу/жабу
const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

if (profileBtn) {
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("show");
  });
}

// "Шығу" батырмасы
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("http://127.0.0.1:5000/api/logout", { method: "POST", credentials: "include" });
  window.location.reload();
});

// Сыртты басқанда мәзірді жабу
document.addEventListener("click", () => profileMenu?.classList.remove("show"));

// Бет жүктелгенде функцияны іске қосу
document.addEventListener("DOMContentLoaded", loadUser);