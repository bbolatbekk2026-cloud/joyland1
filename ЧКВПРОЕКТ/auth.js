const API = "http://127.0.0.1:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const goRegister = document.getElementById("goRegister");
  const goLogin = document.getElementById("goLogin");
  const messageBox = document.getElementById("messageBox");

  function showLogin() {
    loginTab?.classList.add("active");
    registerTab?.classList.remove("active");
    loginForm?.classList.add("active");
    registerForm?.classList.remove("active");
    if (messageBox) {
      messageBox.textContent = "";
      messageBox.style.color = "#ef4444";
    }
  }

  function showRegister() {
    registerTab?.classList.add("active");
    loginTab?.classList.remove("active");
    registerForm?.classList.add("active");
    loginForm?.classList.remove("active");
    if (messageBox) {
      messageBox.textContent = "";
      messageBox.style.color = "#ef4444";
    }
  }

  loginTab?.addEventListener("click", showLogin);
  registerTab?.addEventListener("click", showRegister);
  goRegister?.addEventListener("click", showRegister);
  goLogin?.addEventListener("click", showLogin);

  document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  window.authUI = { API, messageBox, showLogin, showRegister };
});