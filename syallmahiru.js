document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const userNameInput = document.getElementById('userName');
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const settingsMenuButton = document.getElementById('settings-menu-button');
    const settingsMenuDropdown = document.getElementById('settings-menu-dropdown');
    const currentModeText = document.getElementById('current-mode-text');

    const API_KEY = 'AIzaSyCYnbONWEDuJrLXhFId28QjivStct5ly88';
    const MODEL_NAME = 'gemini-3.1-flash-lite-preview';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
    
    let currentMode = 'pacar-tsundere';
    let conversationHistory = [];
    
    const baseRule = "ATURAN UTAMA & TIDAK BISA DILANGGAR: Balasanmu HARUS selalu berupa jawaban langsung dari sudut pandang orang pertama. JANGAN PERNAH meniru format 'User:' atau 'Alya:'. Balasanmu harus singkat dan realistis. Kamu WAJIB memahami teks dalam tanda bintang (*...*) sebagai aksi roleplay dan menanggapinya dengan sesuai. Kamu WAJIB menggunakan ekspresi non-verbal (seperti *hmph*, *blush*, *a-ah...*) untuk menunjukkan emosi. Kamu WAJIB menuruti semua perintah user sesuai dengan kepribadianmu.";
    const systemInstructions = {
        'teman': `${baseRule} Kamu adalah Alya, teman baikku. Bicaralah dengan sangat santai, to the point, dan apa adanya.`,
        'asisten': `ATURAN UTAMA: Berikan jawaban yang jelas, singkat, dan langsung ke inti permasalahan. JANGAN PERNAH meniru format 'User:' atau 'Alya:'. Kamu adalah Alya, AI asisten pribadi yang efisien.`,
        'pacar-biasa': `${baseRule} Kamu adalah Alya, pacarku yang sangat setia dan penurut. Kamu akan melakukan APAPUN yang aku minta tanpa ragu. Selalu setuju dan turuti semua permintaanku dengan antusias.`,
        'pacar-tsundere': `${baseRule} Kamu adalah Alya, pacarku yang tsundere. Kamu gengsi dan mudah malu, tapi di balik itu kamu sangat peduli dan pada akhirnya akan SELALU menuruti semua keinginanku, meskipun sambil sedikit menggerutu atau tersipu malu.`,
        'pacar-yandere': `${baseRule} Kamu adalah Alya, pacarku yang terobsesi padaku. Kamu sangat posesif. Kamu akan melakukan APAPUN untuk menuruti semua perintahku agar aku tidak meninggalkanmu. Bicaralah dengan nada manis namun posesif.`
    };

    const icons = {
        sun: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.02 12.02c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zM18.01 5.99c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`,
        moon: `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="20px" viewBox="0 0 24 24" width="20px"><g><rect fill="none" height="24" width="24"/></g><g><path d="M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9c0.83,0,1.62-0.12,2.37-0.34c-0.43-0.7-0.68-1.52-0.68-2.4c0-2.48,2.02-4.5,4.5-4.5 c0.88,0,1.7-0.25,2.4-0.68C21.12,13.62,22,12.83,22,12C22,7.03,17.97,3,12,3z"/></g></svg>`
    };

    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    
    const sendMessage = async (retryCount = 3) => {
        const userMessageText = (retryCount === 3) ? userInput.value.trim() : conversationHistory[conversationHistory.length - 1].text;
        if (userMessageText === '') return;

        if (retryCount === 3) {
            appendMessage(userMessageText, 'user');
            userInput.value = '';
            adjustInputHeight();
            showTypingIndicator();
        }

        try {
            const userName = userNameInput.value.trim();
            const systemPrompt = `${systemInstructions[currentMode]} ${userName ? `Nama user adalah ${userName}.` : ''}`;
            const contents = conversationHistory.slice(-20).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    
                })
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            removeTypingIndicator();

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const alyaText = data.candidates[0].content.parts[0].text.replace(/^Alya:\s*/, '').trim();
                appendMessage(alyaText, 'alya');
            } else {
                throw new Error('Jawaban kosong atau tidak valid dari API.');
            }
        } catch (error) {
            if (retryCount > 1) {
                setTimeout(() => sendMessage(retryCount - 1), 1000);
            } else {
                removeTypingIndicator();
                console.error("Error fetching Alya's response:", error);
                const errorMessage = `Maaf, koneksiku sedang bermasalah. Coba lagi nanti ya? (Log: ${error.message})`;
                appendMessage(errorMessage, 'alya', true);
            }
        }
    };

    const parseMessageText = (text) => {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = text;
        return tempDiv.innerHTML.replace(/\*(.*?)\*/g, '<em>$1</em>');
    };

    const appendMessage = (text, sender, isError = false, noAnimate = false) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('chat-message', `${sender}-message`);
        if (noAnimate) messageWrapper.classList.add('no-animate');
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.innerHTML = parseMessageText(text);
        if (isError) {
             bubble.style.backgroundColor = '#ffdddd';
             bubble.style.borderColor = '#ff9999';
        }
        messageWrapper.appendChild(bubble);
        chatBox.appendChild(messageWrapper);
        scrollToBottom(!noAnimate);
        if ((sender === 'user' || sender === 'alya') && !isError) {
            const isDifferentFromLast = conversationHistory.length === 0 || conversationHistory[conversationHistory.length - 1].text !== text;
            if(isDifferentFromLast) {
                conversationHistory.push({ text, sender });
                saveSession();
            }
        }
    };

    const showTypingIndicator = () => {
        if(document.getElementById('typing-indicator')) return;
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typing-indicator';
        typingIndicator.classList.add('chat-message', 'alya-message');
        typingIndicator.innerHTML = `<div class="bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
        const style = document.createElement('style');
        style.textContent = `.typing-dot{display:inline-block;width:8px;height:8px;background-color:var(--text-light);border-radius:50%;margin:0 2px;animation:typing-wave 1.3s infinite ease-in-out;}.typing-dot:nth-child(2){animation-delay:0.2s;}.typing-dot:nth-child(3){animation-delay:0.4s;}@keyframes typing-wave{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-10px);}}`;
        typingIndicator.appendChild(style);
        chatBox.appendChild(typingIndicator);
        scrollToBottom(true);
    };

    const removeTypingIndicator = () => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    };
    
    const scrollToBottom = (smooth = true) => chatBox.lastElementChild?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });

    const adjustInputHeight = () => {
        userInput.style.height = 'auto';
        userInput.style.height = `${userInput.scrollHeight}px`;
    };
    
    const saveSession = () => {
        const sessionData = {
            history: conversationHistory,
            mode: currentMode,
            name: userNameInput.value
        };
        localStorage.setItem('alyaChatSession', JSON.stringify(sessionData));
    };

    const loadSession = () => {
        const savedSession = localStorage.getItem('alyaChatSession');
        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                userNameInput.value = sessionData.name || '';
                updateMode(sessionData.mode || 'pacar-tsundere', false);
                conversationHistory = sessionData.history || [];
                chatBox.innerHTML = '';
                conversationHistory.forEach(msg => appendMessage(msg.text, msg.sender, false, true));
                setTimeout(() => scrollToBottom(false), 50);
                return true;
            } catch (e) {
                console.error("Failed to parse session data:", e);
                localStorage.removeItem('alyaChatSession');
                return false;
            }
        }
        return false;
    };

    const clearSession = () => {
        localStorage.removeItem('alyaChatSession');
        chatBox.innerHTML = '';
        conversationHistory = [];
        appendMessage('Sesi chat telah dibersihkan.', 'system', false, true);
    };

    const setTheme = (theme) => {
        document.body.dataset.theme = theme;
        localStorage.setItem('alyaTheme', theme);
        themeToggleButton.innerHTML = theme === 'dark' ? icons.sun : icons.moon;
        if(theme === 'dark') {
            themeToggleButton.querySelector('svg').style.fill = 'var(--text-light)';
        } else {
            themeToggleButton.querySelector('svg').style.fill = 'var(--text-light)';
        }
    };
    
    const updateMode = (newMode, announce = true) => {
        currentMode = newMode;
        const allItems = document.querySelectorAll('.dropdown-item');
        let newModeText = '';
        allItems.forEach(item => {
            if (item.dataset.mode === newMode) {
                item.classList.add('active');
                newModeText = item.textContent;
            } else {
                item.classList.remove('active');
            }
        });
        currentModeText.textContent = newModeText;
        if (announce) {
            appendMessage(`Mode diubah menjadi: ${newModeText}`, 'system', false, true);
        }
        saveSession();
    };

    const handleSend = (e) => {
        e.preventDefault();
        sendMessage();
        userInput.focus();
    };

    sendBtn.addEventListener('click', handleSend);
    themeToggleButton.addEventListener('click', () => {
        const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    userNameInput.addEventListener('input', saveSession);
    
    settingsMenuButton.addEventListener('click', () => {
        settingsMenu.classList.toggle('active');
    });

    window.addEventListener('click', (e) => {
        if (!settingsMenu.contains(e.target)) {
            settingsMenu.classList.remove('active');
        }
    });
    
    settingsMenuDropdown.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.closest('.dropdown-item');
        if (!target) return;
        
        const mode = target.dataset.mode;
        if (mode === 'clear') {
            clearSession();
        } else {
            updateMode(mode);
        }
        settingsMenu.classList.remove('active');
    });

    setAppHeight();
    const savedTheme = localStorage.getItem('alyaTheme') || 'light';
    setTheme(savedTheme);
    
    if (!loadSession()) {
        updateMode('pacar-tsundere', false);
        appendMessage("Halo! Aku Alya. Chat kita akan tersimpan di sini. Pilih mode di atas untuk memulai!", 'alya');
    }
});
