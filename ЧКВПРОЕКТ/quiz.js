// quiz.js (beautiful + correct marking)
document.addEventListener("DOMContentLoaded", ()=>{
  const submit = document.getElementById("submitQuiz");
  const reset = document.getElementById("resetQuiz");
  const form = document.getElementById("quizForm");
  const res = document.getElementById("quizResult");

  if(!submit || !form) return;

  const answers = { q1:"b", q2:"b", q3:"b", q4:"b", q5:"b", q6:"a", q7:"b" };

  function clearMarks(){
    form.querySelectorAll(".q").forEach(block=>{
      block.classList.remove("correct","wrong");
      block.querySelectorAll(".opt").forEach(opt=>{
        opt.classList.remove("ok","bad","selected");
      });
    });
  }

  // ✅ таңдағанда selected класын қосу
  form.addEventListener("change", (e)=>{
    if(e.target && e.target.matches('input[type="radio"]')){
      const qBlock = e.target.closest(".q");
      qBlock?.querySelectorAll(".opt").forEach(o=> o.classList.remove("selected"));
      e.target.closest(".opt")?.classList.add("selected");
    }
  });

  submit.addEventListener("click", ()=>{
    // алдыңғы белгілерді тазалау
    form.querySelectorAll(".q").forEach(block=>{
      block.classList.remove("correct","wrong");
      block.querySelectorAll(".opt").forEach(opt=>{
        opt.classList.remove("ok","bad");
      });
    });

    let score = 0;
    let answered = 0;

    for(const qName in answers){
      const chosen = form.querySelector(`input[name="${qName}"]:checked`);
      if(chosen) answered++;

      const block = form.querySelector(`input[name="${qName}"]`)?.closest(".q");
      const right = answers[qName];

      const rightInput = form.querySelector(`input[name="${qName}"][value="${right}"]`);
      const rightOpt = rightInput?.closest(".opt");

      if(chosen && chosen.value === right){
        score++;
        block?.classList.add("correct");
        chosen.closest(".opt")?.classList.add("ok");
      } else {
        block?.classList.add("wrong");
        rightOpt?.classList.add("ok");
        chosen?.closest(".opt")?.classList.add("bad");
      }
    }

    if(answered < 7){
      res.style.display = "block";
      res.innerHTML = `⚠️ Барлық сұраққа жауап бер: <b>${answered}/7</b>`;
      return;
    }

    let msg = "Жарайсың! 🎉";
    if(score <= 2) msg = "Тағы қайталап көр 🙂";
    else if(score <= 4) msg = "Жақсы! Тағы болады 😄";
    else if(score <= 6) msg = "Керемет! Аз қалды 💪";

    res.style.display = "block";
    res.innerHTML = `<b>Нәтиже:</b> ${score} / 7 ✅ <br><span class="tiny">${msg}</span>`;
  });

  reset?.addEventListener("click", ()=>{
    form.reset();
    clearMarks();
    if(res){
      res.style.display = "none";
      res.innerHTML = "";
    }
  });
});