function $(id){ return document.getElementById(id); }

function uid(){
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

function formatBookingText(b){
  return [
    "JOYLAND | BRONЬ",
    "========================",
    `ID: ${b.id}`,
    `Жасалған уақыты: ${b.createdAt}`,
    "",
    `Аты-жөні: ${b.name}`,
    `Телефон: ${b.phone}`,
    `Күні: ${b.date}`,
    `Уақыты: ${b.time}`,
    `Қонақ саны: ${b.guests}`,
    `Пакет: ${b.package}`,
    `Төлем: ${b.pay}`,
    `Түсініктеме: ${b.note || "-"}`,
    "",
    "Ескерту: Бұл файл оқу жобасы үшін жасалды.",
  ].join("\n");
}

function getBookings(){
  try{ return JSON.parse(localStorage.getItem("jl_bookings") || "[]"); }
  catch{ return []; }
}
function saveBookings(list){
  localStorage.setItem("jl_bookings", JSON.stringify(list));
}

function renderBookings(){
  const box = $("bookingList");
  if(!box) return;

  const list = getBookings();
  if(list.length === 0){
    box.innerHTML = `<div class="tiny" style="color:var(--muted)">Әзірге бронь жоқ.</div>`;
    return;
  }

  box.innerHTML = list
    .slice()
    .reverse()
    .map(b => `
      <div class="b-item">
        <b>${b.name}</b> — ${b.date} ${b.time}<br>
        <span class="tiny">ID: ${b.id} | Қонақ: ${b.guests} | Пакет: ${b.package}</span>
        <div class="b-actions">
          <button class="btn" type="button" data-dl="${b.id}">⬇️ Файл</button>
          <button class="btn" type="button" data-del="${b.id}">🗑️ Өшіру</button>
        </div>
      </div>
    `).join("");

  // жеке файл жүктеу
  box.querySelectorAll("[data-dl]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-dl");
      const b = getBookings().find(x=>x.id===id);
      if(!b) return;
      downloadTextFile(`JoyLand_Bron_${b.id}.txt`, formatBookingText(b));
    });
  });

  // өшіру
  box.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del");
      const list = getBookings().filter(x=>x.id !== id);
      saveBookings(list);
      renderBookings();
    });
  });
}

function showResult(b){
  const res = $("bookingResult");
  const dl = $("downloadBooking");
  if(res){
    res.style.display = "block";
    res.innerHTML = `
      <b>✅ Бронь қабылданды!</b><br>
      ID: <b>${b.id}</b><br>
      Күні: <b>${b.date}</b> | Уақыты: <b>${b.time}</b><br>
      <span class="tiny">Файл автоматты түрде жүктелді. Қайта жүктеу үшін төмендегі батырманы бас.</span>
    `;
  }
  if(dl){
    dl.style.display = "block";
    dl.onclick = ()=> downloadTextFile(`JoyLand_Bron_${b.id}.txt`, formatBookingText(b));
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  // жыл
  const y = document.getElementById("y");
  if(y) y.textContent = new Date().getFullYear();

  renderBookings();

  $("bookingForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();

    const name = ($("bName")?.value || "").trim();
    const phone = ($("bPhone")?.value || "").trim();
    const date = ($("bDate")?.value || "").trim();
    const time = ($("bTime")?.value || "").trim();
    const guests = ($("bGuests")?.value || "—").trim();
    const pack = ($("bPackage")?.value || "Стандарт").trim();
    const pay = ($("bPay")?.value || "Қолма-қол").trim();
    const note = ($("bNote")?.value || "").trim();

    if(!name || !phone || !date || !time){
      alert("Аты-жөні, телефон, күні және уақыты міндетті!");
      return;
    }

    const b = {
      id: uid(),
      createdAt: new Date().toLocaleString(),
      name, phone, date, time,
      guests, package: pack, pay, note
    };

    // сақтау
    const list = getBookings();
    list.push(b);
    saveBookings(list);

    // экранға шығару
    showResult(b);

    // ✅ автоматты түрде файл жүктеу
    downloadTextFile(`JoyLand_Bron_${b.id}.txt`, formatBookingText(b));

    // лист жаңарту
    renderBookings();

    // форманы тазалау (қаласаң)
    // $("bookingForm").reset();
    // $("bGuests").value = 10;
  });

  $("clearBookings")?.addEventListener("click", ()=>{
    if(!confirm("Барлық броньды өшірейін бе?")) return;
    saveBookings([]);
    renderBookings();
  });

  $("downloadAll")?.addEventListener("click", ()=>{
    const list = getBookings();
    if(list.length === 0){
      alert("Бронь жоқ.");
      return;
    }
    const text = list.map(formatBookingText).join("\n\n---\n\n");
    downloadTextFile(`JoyLand_AllBookings_${new Date().toISOString().slice(0,10)}.txt`, text);
  });
});