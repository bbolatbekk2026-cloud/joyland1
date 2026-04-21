/* =========================
   JOYLAND script.js (fixed)
   - auth guard
   - toast (single)
   - particles bg
   - auth page (index1.html)
   - mini profile near Booking (profileWrap/profileName/logoutBtn)
   - booking -> download file (instead of WhatsApp)
   ========================= */

/* ===== AUTH GUARD ===== */
// (function authGuard() {
//   const page = (location.pathname.split("/").pop() || "").toLowerCase();
//
//   // login/register page
//   if (page === "index1.html") return;
//
//   const session = localStorage.getItem("jl_session");
//   if (!session) {
//     location.replace("index1.html");
//   }
// })();

/* ===== YEAR ===== */
(function setYear(){
  const yEl = document.getElementById("y");
  if (yEl) yEl.textContent = new Date().getFullYear();
})();

/* ===== TOAST (single) ===== */
let __toastTimer = null;
function showToast(title, text){
  const t = document.getElementById("toast");
  if(!t) return;

  const tt = document.getElementById("toastTitle");
  const tx = document.getElementById("toastText");
  if(tt) tt.textContent = title;
  if(tx) tx.textContent = text;

  t.style.display = "block";
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(()=> t.style.display="none", 3200);
}

/* promo example */
(function promoHook(){
  const promoBtn = document.getElementById("promoBtn");
  if(promoBtn){
    promoBtn.addEventListener("click", ()=> showToast("🎁 Акция", "Бүгін туған күн пакеті -10% (үлгі)"));
  }
})();

/* ===== PARTICLES BACKGROUND ===== */
(function particlesBG(){
  const canvas = document.getElementById("bg");
  if(!canvas) return;

  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;

  function resize(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const rand = (a,b)=> a + Math.random()*(b-a);
  const particles = [];
  const COUNT = Math.round(Math.min(120, Math.max(70, W / 12)));

  function makeParticle(){
    return {
      x: rand(0, W),
      y: rand(0, H),
      r: rand(1.2, 3.6),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.18, 0.22),
      a: rand(0.10, 0.35)
    };
  }
  for(let i=0;i<COUNT;i++) particles.push(makeParticle());

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "rgba(7,10,22,0.30)";
    ctx.fillRect(0,0,W,H);

    for(const p of particles){
      p.x += p.vx; p.y += p.vy;
      if(p.x < -10) p.x = W+10;
      if(p.x > W+10) p.x = -10;
      if(p.y < -10) p.y = H+10;
      if(p.y > H+10) p.y = -10;

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*6);
      g.addColorStop(0, `rgba(255,255,255,${p.a})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*6, 0, Math.PI*2);
      ctx.fill();
    }

    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        const maxD = 130;
        if(d2 < maxD*maxD){
          const d = Math.sqrt(d2);
          const alpha = (1 - d/maxD) * 0.12;
          ctx.strokeStyle = `rgba(180,210,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

/* ===== AUTH HELPERS ===== */
function getUsers(){
  try { return JSON.parse(localStorage.getItem("jl_users") || "[]"); }
  catch { return []; }
}
function saveUsers(users){
  localStorage.setItem("jl_users", JSON.stringify(users));
}
function setSession(userObj){
  localStorage.setItem("jl_session", JSON.stringify({
    user: userObj.user,
    name: userObj.name,
    ts: Date.now()
  }));
}
function clearSession(){
  localStorage.removeItem("jl_session");
}
function normalizeUser(u){
  return (u || "").trim().toLowerCase();
}

/* ===== LOGIN / REGISTER (index1.html) ===== */
(function initAuthPage(){
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  if(page !== "index1.html") return;

  const loginUser = document.getElementById("loginUser");
  const loginPass = document.getElementById("loginPass");
  const loginBtn  = document.getElementById("loginBtn");

  const regName = document.getElementById("regName");
  const regUser = document.getElementById("regUser");
  const regPass = document.getElementById("regPass");
  const regBtn  = document.getElementById("regBtn");

  const toRegister = document.getElementById("toRegister");
  const toLogin = document.getElementById("toLogin");
  const regBox = document.getElementById("regBox");

  // already logged in
  if(localStorage.getItem("jl_session")){
    location.replace("index.html");
    return;
  }

  toRegister?.addEventListener("click", ()=>{
    regBox?.scrollIntoView({behavior:"smooth", block:"start"});
    regUser?.focus();
  });
  toLogin?.addEventListener("click", ()=>{
    window.scrollTo({top:0, behavior:"smooth"});
    loginUser?.focus();
  });

  regBtn?.addEventListener("click", ()=>{
    const name = (regName?.value || "").trim();
    const user = normalizeUser(regUser?.value);
    const pass = (regPass?.value || "").trim();

    if(!name || !user || pass.length < 4){
      showToast("⚠️ Қате", "Атың, email/телефон және құпиясөз (кемі 4 белгі) керек.");
      return;
    }

    const users = getUsers();
    if(users.some(x => x.user === user)){
      showToast("⚠️ Бар", "Бұл аккаунт бұрын тіркелген. Кіруді қолданып көр.");
      return;
    }

    users.push({ name, user, pass });
    saveUsers(users);
    showToast("✅ Дайын", "Тіркелдіңіз! Енді кіруге болады.");

    if(loginUser) loginUser.value = user;
    if(loginPass) loginPass.value = pass;
    window.scrollTo({top:0, behavior:"smooth"});
  });

  // loginBtn?.addEventListener("click", ()=>{
  //   const user = normalizeUser(loginUser?.value);
  //   const pass = (loginPass?.value || "").trim();

  //   if(!user || !pass){
  //     showToast("⚠️ Қате", "Email/телефон және құпиясөзді енгіз.");
  //     return;
  //   }

  //   const users = getUsers();
  //   const found = users.find(x => x.user === user && x.pass === pass);
  //   if(!found){
  //     showToast("❌ Қате", "Логин немесе құпиясөз дұрыс емес.");
  //     return;
  //   }

  //   setSession(found);
  //   showToast("✅ Кірдіңіз", "Сайт ашылып жатыр...");
  //   setTimeout(()=> location.replace("index.html"), 350);
  // });
})();

/* ===== MINI PROFILE (near Booking) + LOGOUT ===== */
(function initMiniProfile(){
  const wrap = document.getElementById("profileWrap");   // сен қойған mini профиль контейнері
  const nameEl = document.getElementById("profileName"); // "Алихан" шығатын жер
  if(!wrap || !nameEl) return;

  let s = null;
  try { s = JSON.parse(localStorage.getItem("jl_session") || "null"); } catch {}

  if(!s){
    wrap.style.display = "none";
    return;
  }

  wrap.style.display = "flex";
  nameEl.textContent = s.name || "Қонақ";

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", ()=>{
    clearSession();
    location.replace("index1.html");
  });
})();

/* =======================================================
   BOOKING: WhatsApp орнына файл скачать
   ======================================================= */

/* helper */
function _uid(){
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
function downloadTextFile(filename, text){
  const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function getBookings(){
  try { return JSON.parse(localStorage.getItem("jl_bookings") || "[]"); }
  catch { return []; }
}
function saveBookings(list){
  localStorage.setItem("jl_bookings", JSON.stringify(list));
}
function formatBookingText(b){
  return [
    "JOYLAND | BRONЬ",
    "========================",
    `ID: ${b.id}`,
    `Жасалған уақыты: ${b.createdAt}`,
    "",
    `Аты-жөні: ${b.name}`,
    `Телефон: ${b.phone}`,
    `Қызмет/Пакет: ${b.service || b.package || "-"}`,
    `Күні: ${b.date || "-"}`,
    `Уақыты: ${b.time || "-"}`,
    `Қосымша: ${b.note || b.msg || "-"}`,
    "",
    "Ескерту: Бұл файл оқу жобасы үшін жасалды."
  ].join("\n");
}

/*
  booking.html екі түрлі болуы мүмкін:
  1) Сенің жаңа booking.html: bName,bPhone,bDate,bTime,bGuests,bPackage,bPay,bNote, bookingForm
  2) Ескі форма: name,phone,service,date,msg + waBtn

  Төмендегі код екеуін де ұстайды:
  - Егер bookingForm бар болса -> сонымен жұмыс істейді
  - Әйтпесе waBtn бар болса -> оны download-қа айналдырады
*/
(function initBookingDownload(){
  // NEW booking page (recommended)
  const bookingForm = document.getElementById("bookingForm");
  if(bookingForm){
    bookingForm.addEventListener("submit", (e)=>{
      e.preventDefault();

      const name = (document.getElementById("bName")?.value || "").trim();
      const phone = (document.getElementById("bPhone")?.value || "").trim();
      const date = (document.getElementById("bDate")?.value || "").trim();
      const time = (document.getElementById("bTime")?.value || "").trim();
      const guests = (document.getElementById("bGuests")?.value || "—").trim();
      const pack = (document.getElementById("bPackage")?.value || "Стандарт").trim();
      const pay = (document.getElementById("bPay")?.value || "—").trim();
      const note = (document.getElementById("bNote")?.value || "").trim();

      if(!name || !phone || !date || !time){
        showToast("⚠️ Толтыру керек", "Аты-жөні, телефон, күні және уақыты міндетті.");
        return;
      }

      const b = {
        id: _uid(),
        createdAt: new Date().toLocaleString(),
        name, phone, date, time,
        guests, package: pack, pay, note,
        service: pack // бір форматқа келтіру
      };

      const list = getBookings();
      list.push(b);
      saveBookings(list);

      // экранға қысқа нәтиже
      const res = document.getElementById("bookingResult");
      if(res){
        res.style.display = "block";
        res.innerHTML = `<b>✅ Бронь дайын!</b><br>ID: <b>${b.id}</b><br><span class="tiny">Файл жүктелді.</span>`;
      }

      // download button (optional)
      const dlBtn = document.getElementById("downloadBooking");
      if(dlBtn){
        dlBtn.style.display = "block";
        dlBtn.onclick = ()=> downloadTextFile(`JoyLand_Bron_${b.id}.txt`, formatBookingText(b));
      }

      // ✅ automatic download
      downloadTextFile(`JoyLand_Bron_${b.id}.txt`, formatBookingText(b));
      showToast("✅ Дайын", "Бронь файлы скачаться болды.");
    });

    return; // new booking handled
  }

  // OLD page: replace WhatsApp button behavior
  const waBtn = document.getElementById("waBtn");
  if(waBtn){
    waBtn.addEventListener("click", ()=>{
      const name = (document.getElementById("name")?.value || "").trim();
      const phone = (document.getElementById("phone")?.value || "").trim();
      const service = (document.getElementById("service")?.value || "").trim();
      const date = (document.getElementById("date")?.value || "").trim();
      const msg = (document.getElementById("msg")?.value || "").trim();

      if(!name || !phone){
        showToast("⚠️ Толтыру керек", "Атыңыз бен телефонды енгізіңіз.");
        return;
      }

      const b = {
        id: _uid(),
        createdAt: new Date().toLocaleString(),
        name, phone, service, date, msg
      };

      const list = getBookings();
      list.push(b);
      saveBookings(list);

      downloadTextFile(`JoyLand_Bron_${b.id}.txt`, formatBookingText(b));
      showToast("✅ Дайын");
    });
  }
})();
const user = JSON.parse(localStorage.getItem("jl_current_user"))

if(user){

const name = document.getElementById("profileName")
const wrap = document.getElementById("profileWrap")

if(name && wrap){

name.textContent = user.name
wrap.style.display = "block"

}

}

/* ===== END ===== */


document.addEventListener("DOMContentLoaded", async () => {
  const yearEl = document.getElementById("y");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const profileWrap = document.getElementById("profileWrap");
  const profileName = document.getElementById("profileName");
  const logoutBtn = document.getElementById("logoutBtn");
  const authLink = document.getElementById("authLink");

  const token = localStorage.getItem("token");

  if (!token) {
    if (profileWrap) profileWrap.style.display = "none";
    if (authLink) authLink.style.display = "inline-flex";
    return;
  }

  try {
    const r = await fetch("http://127.0.0.1:5050/api/me", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const data = await r.json();

    if (!r.ok || !data.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");

      if (profileWrap) profileWrap.style.display = "none";
      if (authLink) authLink.style.display = "inline-flex";
      return;
    }

    if (profileName) {
      profileName.textContent = data.name || "Пайдаланушы";
    }

    if (profileWrap) profileWrap.style.display = "flex";
    if (authLink) authLink.style.display = "none";

  } catch (e) {
    if (profileWrap) profileWrap.style.display = "none";
    if (authLink) authLink.style.display = "inline-flex";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const token = localStorage.getItem("token");

      try {
        if (token) {
          await fetch("http://127.0.0.1:5000/api/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ token })
          });
        }
      } catch (e) {}

      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");

      window.location.href = "index1.html";
    });
  }
});