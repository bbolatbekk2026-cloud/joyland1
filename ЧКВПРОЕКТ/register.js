document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("fullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    const { API, messageBox } = window.authUI;

    if (password !== confirmPassword) {
      messageBox.textContent = "Құпиясөздер сәйкес келмейді";
      messageBox.style.color = "#ef4444";
      return;
    }

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        messageBox.textContent = data.message || "Тіркелу сәтсіз";
        messageBox.style.color = "#ef4444";
        return;
      }

      messageBox.textContent = data.message || "Тіркелу сәтті";
      messageBox.style.color = "#22c55e";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 700);
    } catch (err) {
      console.error(err);
      messageBox.textContent = "Серверге қосылу мүмкін болмады";
      messageBox.style.color = "#ef4444";
    }
  });
});