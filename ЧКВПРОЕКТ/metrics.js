// metrics.js — Fitts + Hick + Task time -> /api/metrics (Flask)
const API = "http://127.0.0.1:5050/api";

async function sendMetric(payload) {
  try {
    const r = await fetch(API + "/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Егер сервер қате берсе — браузерде көрінсін
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      console.warn("metrics server error:", r.status, txt);
    }
  } catch (e) {
    console.warn("metrics fail:", e);
  }
}

function fittsCalc(pointerX, pointerY, element) {
  const r = element.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const D = Math.sqrt((pointerX - cx) ** 2 + (pointerY - cy) ** 2);
  const W = Math.min(r.width, r.height) || 1; // 0 болса қате болмау үшін
  const ID = Math.log2(D / W + 1);

  return {
    D: +D.toFixed(2),
    W: +W.toFixed(2),
    ID: +ID.toFixed(3),
  };
}

function hickCalc(N) {
  return { N, H: +Math.log2(N + 1).toFixed(3) };
}

document.addEventListener("DOMContentLoaded", () => {
  const pageStart = performance.now();
  let lastPointer = { x: 0, y: 0 };

  // курсор позициясын ұстап тұрамыз (Fitts үшін)
  document.addEventListener("mousemove", (e) => {
    lastPointer = { x: e.clientX, y: e.clientY };
  });

  // Сенің батырма id-лерің осылар болуы керек:
  const loginBtn = document.getElementById("loginBtn");
  const regBtn = document.getElementById("regBtn");

  if (!loginBtn) console.warn("metrics.js: loginBtn табылмады (id='loginBtn')");
  if (!regBtn) console.warn("metrics.js: regBtn табылмады (id='regBtn')");

  // Hick: экрандағы негізгі action-choice саны
  const choiceButtons = [loginBtn, regBtn].filter(Boolean);
  const hick = hickCalc(choiceButtons.length);

  // бет ашылғанда Hick мәнін жазамыз
  sendMetric({
    type: "hick_page",
    page: location.pathname,
    ...hick,
  });

  function wrap(btn, name) {
    if (!btn) return;

    btn.addEventListener("click", () => {
      const taskTimeMs = Math.round(performance.now() - pageStart);
      const fitts = fittsCalc(lastPointer.x, lastPointer.y, btn);

      sendMetric({
        type: "click",
        btn: name,
        page: location.pathname,
        taskTimeMs,
        ...fitts,
        ...hick,
      });
    });
  }

  wrap(loginBtn, "loginBtn");
  wrap(regBtn, "regBtn");
});