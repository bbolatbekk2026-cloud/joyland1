document.addEventListener("DOMContentLoaded", async () => {
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileBio = document.getElementById("profileBio");
  const profileAvatar = document.getElementById("profileAvatar");
  const chooseImageBtn = document.getElementById("chooseImageBtn");
  const imageInput = document.getElementById("imageInput");
  const profileForm = document.getElementById("profileForm");
  const profileMessage = document.getElementById("profileMessage");
  const goHomeBtn = document.getElementById("goHomeBtn");

  let selectedFile = null;

  try {
    const res = await fetch("http://127.0.0.1:5000/api/me", {
      method: "GET",
      credentials: "include"
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      window.location.href = "index1.html";
      return;
    }

    const user = data.user || {};

    if (profileName) profileName.value = user.username || "";
    if (profileEmail) profileEmail.value = user.email || "";
    if (profileBio) profileBio.value = user.bio || "";

    if (profileAvatar && user.avatar) {
      if (user.avatar === "default-avatar.webp") {
        profileAvatar.src = "default-avatar.webp";
      } else {
        profileAvatar.src = `http://127.0.0.1:5000/uploads/${user.avatar}`;
      }
    }

  } catch (e) {
    console.error(e);
    window.location.href = "index1.html";
    return;
  }

  if (chooseImageBtn && imageInput) {
    chooseImageBtn.addEventListener("click", () => {
      imageInput.click();
    });
  }

  if (imageInput && profileAvatar) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files?.[0];
      if (!file) return;

      selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        profileAvatar.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append("username", profileName.value.trim());
      formData.append("bio", profileBio.value.trim());

      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      try {
        const res = await fetch("http://127.0.0.1:5000/api/profile", {
          method: "POST",
          credentials: "include",
          body: formData
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          if (profileMessage) {
            profileMessage.textContent = data.message || "Сақтау сәтсіз";
            profileMessage.style.color = "red";
          }
          return;
        }

        if (profileMessage) {
          profileMessage.textContent = data.message || "Профиль сақталды";
          profileMessage.style.color = "#16a34a";
        }

      } catch (err) {
        console.error(err);
        if (profileMessage) {
          profileMessage.textContent = "Серверге қосылмады";
          profileMessage.style.color = "red";
        }
      }
    });
  }

  if (goHomeBtn) {
    goHomeBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
});