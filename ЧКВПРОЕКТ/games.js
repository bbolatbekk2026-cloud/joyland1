// ===== Helper =====
const $ = (id) => document.getElementById(id);

// ===== 1) Қонақ билеті =====
$("makeBadge")?.addEventListener("click", ()=>{
  const name = ($("kidName")?.value || "").trim();
  const ageVal = ($("kidAge")?.value || "").trim();
  const age = Number(ageVal);

  if(!name || !ageVal || !Number.isFinite(age) || age < 1){
    $("badgeResult").style.display = "block";
    $("badgeResult").querySelector(".badge-card").style.background =
      "linear-gradient(135deg, rgba(251,191,36,.20), rgba(255,255,255,.05))";
    $("bName").textContent = "Толтыр 😄";
    $("bAge").textContent = "Атың мен жасың керек";
    $("bStars").textContent = "⭐️";
    return;
  }

  $("bName").textContent = name;
  $("bAge").textContent = `${age} жас`;

  const starsCount = Math.min(5, Math.max(1, (age % 5) + 1));
  $("bStars").textContent = "⭐️".repeat(starsCount);

  // VIP chip: жасқа қарай
  $("vipChip").textContent = age <= 5 ? "MINI" : age <= 9 ? "KIDS" : "PRO";

  $("badgeResult").style.display = "block";
});

// ===== 3) Қазына тап (1–10) =====
let secret = Math.floor(Math.random()*10)+1;
let tries = 3;

function setTries(){
  if($("tries")) $("tries").textContent = String(tries);
}
setTries();

function confettiBurst(){
  const box = $("confetti");
  if(!box) return;
  box.innerHTML = "";
  for(let i=0;i<24;i++){
    const s = document.createElement("span");
    s.style.left = (10 + Math.random()*80) + "%";
    s.style.background = `hsl(${Math.floor(Math.random()*360)}, 90%, 65%)`;
    s.style.animationDelay = (Math.random()*120) + "ms";
    box.appendChild(s);
  }
  setTimeout(()=> box.innerHTML="", 1100);
}

$("checkGuess")?.addEventListener("click", ()=>{
  const v = Number($("guess")?.value);
  const msg = $("guessMsg");

  if(!v || v < 1 || v > 10){
    msg.textContent = "1–10 аралығында сан енгіз 🙂";
    return;
  }
  if(tries <= 0){
    msg.textContent = `Мүмкіндік бітті 😄 Дұрыс сан: ${secret}`;
    return;
  }

  if(v === secret){
    msg.textContent = "🎉 Дұрыс! Қазынаны таптың!";
    tries = 0;
    confettiBurst();
  } else {
    tries--;
    msg.textContent = v < secret ? "Жоғарырақ көр 😄" : "Төменірек көр 🙂";
    if(tries === 0) msg.textContent += ` | Дұрыс сан: ${secret}`;
  }
  setTries();
});

$("resetGuess")?.addEventListener("click", ()=>{
  secret = Math.floor(Math.random()*10)+1;
  tries = 3;
  setTries();
  if($("guessMsg")) $("guessMsg").textContent = "Жаңа ойын басталды ✅";
});

// ===== 6) Пароль генератор =====
function pick(str){ return str[Math.floor(Math.random()*str.length)]; }

$("genPass")?.addEventListener("click", ()=>{
  const len = Math.max(6, Math.min(32, Number($("plen")?.value || 12)));
  const sets = [];
  if($("pNum")?.checked) sets.push("0123456789");
  if($("pLow")?.checked) sets.push("abcdefghijklmnopqrstuvwxyz");
  if($("pUp")?.checked)  sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if($("pSym")?.checked) sets.push("!@#$%^&*()-_=+[]{};:,.?/");

  if(sets.length === 0){
    $("passTip").textContent = "Кемі 1 параметр таңда 😊";
    $("passOut").value = "";
    return;
  }

  let pass = sets.map(s=>pick(s)); // әр топтан 1 символ
  while(pass.length < len){
    const s = sets[Math.floor(Math.random()*sets.length)];
    pass.push(pick(s));
  }
  pass = pass.sort(()=>Math.random()-0.5);

  $("passOut").value = pass.join("");
  $("passTip").textContent = "✅ Дайын! Көшіруді басып ал.";
});

$("copyPass")?.addEventListener("click", async ()=>{
  const out = $("passOut");
  if(!out?.value) return;

  try{
    await navigator.clipboard.writeText(out.value);
    $("passTip").textContent = "📋 Көшірілді!";
  } catch {
    out.select();
    document.execCommand("copy");
    $("passTip").textContent = "📋 Көшірілді!";
  }
});

// ===== 8) Пароль күші =====
function strength(p){
  let score = 0;
  if(p.length >= 8) score += 25;
  if(p.length >= 12) score += 15;
  if(/[a-z]/.test(p)) score += 15;
  if(/[A-Z]/.test(p)) score += 15;
  if(/[0-9]/.test(p)) score += 15;
  if(/[^A-Za-z0-9]/.test(p)) score += 15;
  return Math.min(100, score);
}

$("pcheck")?.addEventListener("input", (e)=>{
  const p = e.target.value || "";
  const s = strength(p);

  $("meterBar").style.width = `${s}%`;
  $("meterText").textContent = `${s}%`;

  let label = "Әлсіз";
  if(s >= 75) label = "Өте мықты";
  else if(s >= 55) label = "Мықты";
  else if(s >= 35) label = "Орташа";

  $("meterPill").textContent = label;
});