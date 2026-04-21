document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const messageBox = document.getElementById("messageBox");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        if (messageBox) {
          messageBox.textContent = data.message || "Кіру сәтсіз";
          messageBox.style.color = "#dc2626";
        }
        return;
      }

      if (messageBox) {
        messageBox.textContent = data.message || "Кіру сәтті";
        messageBox.style.color = "#16a34a";
      }

      setTimeout(() => {
        window.location.href = "profile.html";
      }, 500);

    } catch (err) {
      console.error(err);
      if (messageBox) {
        messageBox.textContent = "Серверге қосылмады";
        messageBox.style.color = "#dc2626";
      }
    }
  });
});