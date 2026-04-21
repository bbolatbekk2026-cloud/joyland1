// ux_metrics.js — Login/Register кезінде UX метрикаларды есептеу + модал көрсету
// Есеп: Task time, Error count, slowest field, Fitts(avg est), Hick(est)

(function () {
  const UX = {
    mode: "Login", // "Login" немесе "Register"
    startAt: 0,
    errors: [],
    fieldActive: null,
    fieldStart: 0,
    fieldTimes: {}, // { "Регистрация: Email": ms, ... }
    lastPointer: { x: 0, y: 0 },
    fittsSamples: [], // [{D,W,ID}]
    choiceCount: 2, // Hick үшін N
  };

  // ---------- helpers ----------
  const now = () => performance.now();

  function addFieldTime(label, ms) {
    if (!label) return;
    UX.fieldTimes[label] = (UX.fieldTimes[label] || 0) + ms;
  }

  function recordError(where, message) {
    UX.errors.push({ where, message });
  }

  function fittsCalc(pointerX, pointerY, element) {
    const r = element.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const D = Math.sqrt((pointerX - cx) ** 2 + (pointerY - cy) ** 2);
    const W = Math.min(r.width, r.height) || 1;
    const ID = Math.log2(D / W + 1);
    return { D, W, ID };
  }

  // Fitts time estimate: T = a + b*ID (демо үшін)
  function fittsTimeMsFromID(ID) {
    const a = 50;   // ms
    const b = 85;   // ms/bit
    return a + b * ID;
  }

  // Hick time estimate: T = c * log2(N+1) (демо үшін)
  function hickTimeMs(N) {
    const c = 180; // ms/bit (демо)
    return c * Math.log2(N + 1);
  }

  function getSlowestField() {
    let maxLabel = null;
    let maxMs = -1;
    for (const [k, v] of Object.entries(UX.fieldTimes)) {
      if (v > maxMs) {
        maxMs = v;
        maxLabel = k;
      }
    }
    return maxLabel ? { label: maxLabel, ms: maxMs } : { label: "-", ms: 0 };
  }

  function msToSec(ms) {
    return (ms / 1000).toFixed(2);
  }

  function avg(arr) {
    if (!arr.length) return 0;
    return arr.reduce((s, x) => s + x, 0) / arr.length;
  }

  // ---------- modal UI ----------
  function ensureModal() {
    if (document.getElementById("uxModalOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "uxModalOverlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,.55);
      display: none; align-items: center; justify-content: center;
      z-index: 9999; padding: 24px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
    `;

    const card = document.createElement("div");
    card.id = "uxModalCard";
    card.style.cssText = `
      width: min(920px, 96vw);
      background: rgba(20,22,30,.95);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,.55);
      padding: 22px;
      color: #e9ecff;
    `;

    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:14px; margin-bottom:14px;">
        <div style="font-size:28px; font-weight:800;">Fitts + Hick есеп (демо)</div>
      </div>
      <div id="uxModalTopLine" style="opacity:.9; margin-bottom:16px;">—</div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:14px;">
        <div style="border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px;">
          <div style="opacity:.7; margin-bottom:6px;">Жалпы уақыт</div>
          <div id="uxTotalTime" style="font-size:34px; font-weight:800;">—</div>
        </div>

        <div style="border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px;">
          <div style="opacity:.7; margin-bottom:6px;">Қате саны</div>
          <div id="uxErrorCount" style="font-size:34px; font-weight:800;">—</div>
        </div>

        <div style="border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px;">
          <div style="opacity:.7; margin-bottom:6px;">Ең көп уақыт кеткен жер</div>
          <div id="uxSlowField" style="font-size:26px; font-weight:700;">—</div>
        </div>

        <div style="border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px;">
          <div style="opacity:.7; margin-bottom:6px;">Fitts (есеп) + Hick (есеп)</div>
          <div id="uxFittsHick" style="font-size:26px; font-weight:800;">—</div>
        </div>
      </div>

      <div id="uxFooter" style="opacity:.75; line-height:1.5; margin: 10px 2px 0;">
        —
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:18px;">
        <button id="uxOkBtn" style="
          padding: 10px 22px; border-radius: 14px; border:0;
          background: #6c63ff; color: #fff; font-weight:800; cursor:pointer;
          font-size: 18px;
        ">OK</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) hideModal();
    });
    document.getElementById("uxOkBtn").addEventListener("click", hideModal);
  }

  function showModal(result) {
    ensureModal();
    const overlay = document.getElementById("uxModalOverlay");

    const top = document.getElementById("uxModalTopLine");
    const total = document.getElementById("uxTotalTime");
    const err = document.getElementById("uxErrorCount");
    const slow = document.getElementById("uxSlowField");
    const fh = document.getElementById("uxFittsHick");
    const footer = document.getElementById("uxFooter");

    top.textContent = `⚠️ ${result.status} • Режим: ${result.mode}. Экранда Fitts/Hick бойынша демо есеп көрсетілді.`;

    total.textContent = `${result.totalSec} сек`;
    err.textContent = `${result.errorCount}`;

    slow.textContent = `${result.slowestLabel} • ${result.slowestSec} сек`;

    fh.textContent = `Fitts: ${result.fittsAvgMs} ms (avg) • Hick: ${result.hickMs} ms (est)`;

    footer.textContent =
      `Қате көп кеткен жер: ${result.errorWhere} (${result.errorCount} қате). ` +
      `Ескерту: бұл “demo” есеп — нақты ғылыми өлшеу емес, бірақ тапсырма үшін жарайды.`;

    overlay.style.display = "flex";
  }

  function hideModal() {
    const overlay = document.getElementById("uxModalOverlay");
    if (overlay) overlay.style.display = "none";
  }

  // ---------- public API ----------
  window.UXMetrics = {
    start(mode) {
      UX.mode = mode || "Login";
      UX.startAt = now();
      UX.errors = [];
      UX.fieldTimes = {};
      UX.fieldActive = null;
      UX.fieldStart = 0;
      UX.fittsSamples = [];

      // Hick: осы экрандағы “негізгі таңдау” саны (login + register батырмалары)
      const loginBtn = document.getElementById("loginBtn");
      const regBtn = document.getElementById("regBtn");
      UX.choiceCount = [loginBtn, regBtn].filter(Boolean).length || 2;
    },

    bindPointer() {
      document.addEventListener("mousemove", (e) => {
        UX.lastPointer = { x: e.clientX, y: e.clientY };
      });
    },

    // input focus/blur уақытын өлшеу
    bindField(inputEl, label) {
      if (!inputEl) return;

      inputEl.addEventListener("focus", () => {
        UX.fieldActive = label;
        UX.fieldStart = now();
      });

      inputEl.addEventListener("blur", () => {
        if (UX.fieldActive === label) {
          addFieldTime(label, now() - UX.fieldStart);
          UX.fieldActive = null;
          UX.fieldStart = 0;
        }
      });

      // Enter басқанда да blur болуы мүмкін емес → сондықтан change кезінен де қор жинаймыз
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          // бір сәттік белгі
          if (UX.fieldActive === label && UX.fieldStart) {
            addFieldTime(label, now() - UX.fieldStart);
            UX.fieldStart = now();
          }
        }
      });
    },

    bindButton(btnEl, nameForFitts) {
      if (!btnEl) return;
      btnEl.addEventListener("click", () => {
        const f = fittsCalc(UX.lastPointer.x, UX.lastPointer.y, btnEl);
        UX.fittsSamples.push(f);
      });
    },

    error(where, message) {
      recordError(where, message);
    },

    // success кезде модалды шығару
    finishSuccess() {
      // егер бір field focus-та қалса — жабамыз
      if (UX.fieldActive && UX.fieldStart) {
        addFieldTime(UX.fieldActive, now() - UX.fieldStart);
        UX.fieldActive = null;
        UX.fieldStart = 0;
      }

      const totalMs = now() - UX.startAt;
      const slow = getSlowestField();

      // Fitts avg estimate
      const fittsMsArr = UX.fittsSamples.map(s => fittsTimeMsFromID(s.ID));
      const fittsAvgMs = Math.round(avg(fittsMsArr) || 0);

      // Hick estimate
      const hickMs = Math.round(hickTimeMs(UX.choiceCount));

      // error “қай жерде көп” (демо)
      const errorWhere = UX.errors.length
        ? (UX.errors[UX.errors.length - 1].where || UX.mode)
        : UX.mode;

      showModal({
        status: "OK",
        mode: UX.mode === "Register" ? "Регистрация" : "Вход",
        totalSec: msToSec(totalMs),
        errorCount: UX.errors.length,
        slowestLabel: slow.label,
        slowestSec: msToSec(slow.ms),
        fittsAvgMs,
        hickMs,
        errorWhere,
      });
    },

    // fail кезінде қате жазып қоямыз (қаласаң кейін көрсетеміз)
    finishFail(where, message) {
      recordError(where || UX.mode, message || "Қате");
      // мұнда модал шығарып жібермейміз — сенде already alert бар
      // қаласаң: finishSuccess орнына finishFail модал да жасаймыз
    }
  };
})();