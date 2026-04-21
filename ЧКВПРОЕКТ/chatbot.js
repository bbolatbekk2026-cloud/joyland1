/* =======================================================
   JOYLAND CHATBOT SCRIPT (Жаңартылған)
   - Дауысты тану (Speech Recognition)
   - Автоматты түрде беттерге бағыттау (Redirect)
   - Жауапты күту анимациясы (Typing indicator)
   ======================================================= */

const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotBox = document.getElementById('chatbotBox');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotSend = document.getElementById('chatbotSend');
const chatbotMic = document.getElementById('chatbotMic');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotMessages = document.getElementById('chatbotMessages');

// 1. ДАУЫСТЫ ТАНУ (SPEECH RECOGNITION)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.lang = 'kk-KZ';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    chatbotMic.addEventListener('click', () => {
        try {
            recognition.start();
            chatbotMic.style.color = '#ff4b4b'; // Тыңдау кезінде қызыл болады
            chatbotInput.placeholder = "Тыңдап тұрмын...";
        } catch (e) {
            recognition.stop();
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatbotInput.value = transcript;
        chatbotMic.style.color = '';
        chatbotInput.placeholder = "Сұрағыңызды жазыңыз...";
        sendMessage(); // Дауыс танылған соң автоматты жіберу
    };

    recognition.onend = () => {
        chatbotMic.style.color = '';
        chatbotInput.placeholder = "Сұрағыңызды жазыңыз...";
    };

    recognition.onerror = () => {
        chatbotMic.style.color = '';
        console.error("Дауысты тану қатесі");
    };
} else {
    if (chatbotMic) chatbotMic.style.display = 'none';
}

// 2. ХАБАРЛАМА ШЫҒАРУ ФУНКЦИЯСЫ
function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' ? 'user-msg' : 'bot-msg';
    msgDiv.innerText = text;
    chatbotMessages.appendChild(msgDiv);

    // Автоматты түрде төменге түсіру
    chatbotMessages.scrollTo({
        top: chatbotMessages.scrollHeight,
        behavior: 'smooth'
    });
}

// 3. СЕРВЕРГЕ ЖІБЕРУ ЖӘНЕ БАҒЫТТАУ (REDIRECT)
async function sendMessage() {
    const text = chatbotInput.value.trim();
    if (!text) return;

    // Пайдаланушы хабарламасын шығару
    appendMessage('user', text);
    chatbotInput.value = '';

    // Бот жауап бергенше "..." көрсетіп қою (уақытша)
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-msg';
    typingDiv.innerText = '...';
    chatbotMessages.appendChild(typingDiv);

    try {
        // Серверге сұраныс (Порт 5000 екенін ұмытпа)
        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                username: localStorage.getItem('userName') || 'guest'
            })
        });

        const data = await response.json();

        // Typing индикаторын өшіру
        chatbotMessages.removeChild(typingDiv);

        if (data.ok) {
            appendMessage('bot', data.answer);

            // --- БАҒЫТТАУ (REDIRECT) ЛОГИКАСЫ ---
            if (data.redirect) {
                // Пайдаланушы жауапты оқып үлгеруі үшін 2 секунд күтеміз
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 2000);
            }
        } else {
            appendMessage('bot', 'Қате орын алды: ' + (data.message || 'Белгісіз қате'));
        }
    } catch (e) {
        if (typingDiv.parentNode) chatbotMessages.removeChild(typingDiv);
        appendMessage('bot', 'Сервермен байланыс үзілді. Қайта қосылып көріңіз.');
        console.error("Chatbot Error:", e);
    }
}

// 4. ОҚИҒАЛАРДЫ ТЫҢДАУ (EVENT LISTENERS)
chatbotSend.addEventListener('click', sendMessage);

chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

chatbotToggle.addEventListener('click', () => {
    chatbotBox.classList.toggle('show');
    if (chatbotBox.classList.contains('show')) {
        chatbotInput.focus();
    }
});

chatbotClose.addEventListener('click', () => {
    chatbotBox.classList.remove('show');
});