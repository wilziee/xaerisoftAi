// ==========================================
// 1. KONFIGURASI MARKED.JS & HIGHLIGHT.JS
// ==========================================
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

const renderer = new marked.Renderer();
renderer.code = function(code, language) {
    const validLang = hljs.getLanguage(language) ? language : 'plaintext';
    const highlighted = hljs.highlight(code, { language: validLang }).value;
    return `
    <div class="code-block">
        <div class="code-header">
            <span>${validLang.toUpperCase()}</span>
            <button class="copy-btn" onclick="copyCode(this)"><i class="fa-regular fa-copy"></i> Copy</button>
        </div>
        <pre><code class="hljs ${validLang}">${highlighted}</code></pre>
    </div>`;
};
marked.setOptions({ renderer: renderer });

window.copyCode = function(button) {
    const codeBlock = button.parentElement.nextElementSibling.innerText;
    navigator.clipboard.writeText(codeBlock).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => { button.innerHTML = originalText; }, 2000);
    });
};

// ==========================================
// 2. STATE MANAGEMENT & DOM ELEMENTS
// ==========================================
let chatHistory = JSON.parse(localStorage.getItem('xaerisoft_chats')) || [];
let currentChatId = null;

const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const historyList = document.getElementById('chat-history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const sidebar = document.getElementById('sidebar');
const navbar = document.getElementById('navbar');

// ==========================================
// 3. INIT & UI LOGIC
// ==========================================
function init() {
    renderHistoryList();
    if (chatHistory.length > 0) {
        loadChat(chatHistory[0].id);
    }
    
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if(this.value.trim() === '') this.style.height = 'auto';
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
    newChatBtn.addEventListener('click', createNewChat);

    document.getElementById('toggle-sidebar').addEventListener('click', () => sidebar.classList.add('open'));
    document.getElementById('close-sidebar').addEventListener('click', () => sidebar.classList.remove('open'));

    chatBox.addEventListener('scroll', () => {
        if (chatBox.scrollTop > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

// ==========================================
// 4. HISTORY & STORAGE LOGIC
// ==========================================
function saveHistory() {
    localStorage.setItem('xaerisoft_chats', JSON.stringify(chatHistory));
    renderHistoryList();
}

function createNewChat() {
    currentChatId = Date.now().toString();
    const newChat = { id: currentChatId, title: "New Chat", messages: [] };
    chatHistory.unshift(newChat);
    saveHistory();
    chatBox.innerHTML = '';
    chatBox.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'block';
}

function loadChat(id) {
    currentChatId = id;
    const chat = chatHistory.find(c => c.id === id);
    if (!chat) return;

    chatBox.innerHTML = '';
    if (chat.messages.length === 0) {
        chatBox.appendChild(welcomeScreen);
        welcomeScreen.style.display = 'block';
    } else {
        welcomeScreen.style.display = 'none';
        chat.messages.forEach(msg => appendMessage(msg.role, msg.content, false));
    }
    renderHistoryList();
    autoScroll();
}

window.deleteChat = function(id, event) {
    event.stopPropagation();
    chatHistory = chatHistory.filter(c => c.id !== id);
    if (currentChatId === id) {
        if (chatHistory.length > 0) loadChat(chatHistory[0].id);
        else createNewChat();
    } else {
        saveHistory();
    }
}

function renderHistoryList() {
    historyList.innerHTML = '';
    chatHistory.forEach(chat => {
        const li = document.createElement('li');
        if (chat.id === currentChatId) li.classList.add('active');
        li.innerHTML = `
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%;"><i class="fa-regular fa-message"></i> ${chat.title}</span>
            <button class="delete-chat" onclick="deleteChat('${chat.id}', event)" style="background:none;border:none;color:#ff4d4d;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        `;
        li.onclick = () => loadChat(chat.id);
        historyList.appendChild(li);
    });
}

function autoScroll() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

window.setQuickInput = function(text) {
    chatInput.value = text;
    chatInput.dispatchEvent(new Event('input'));
    chatInput.focus();
}

// ==========================================
// 5. CHAT LOGIC & API STREAMING
// ==========================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
        }
    });
}, { threshold: 0.1 });

function observeMessages() {
    document.querySelectorAll('.message').forEach(m => observer.observe(m));
}

function appendMessage(role, text, isStream = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role);
    chatBox.appendChild(msgDiv);

    if (isStream) {
        observeMessages();
        return msgDiv; 
    } else {
        msgDiv.innerHTML = role === 'ai' ? marked.parse(text) : text.replace(/\n/g, '<br>');
        observeMessages();
    }
    autoScroll();
}

function addThinkingAnimation() {
    const div = document.createElement('div');
    div.classList.add('message', 'ai');
    div.id = 'thinking-indicator';
    div.innerHTML = `<div class="thinking"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    chatBox.appendChild(div);
    autoScroll();
    observeMessages();
}

function removeThinkingAnimation() {
    const div = document.getElementById('thinking-indicator');
    if (div) div.remove();
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (!currentChatId || chatHistory.find(c=>c.id===currentChatId).messages.length === 0) {
        const chat = chatHistory.find(c => c.id === currentChatId) || { id: Date.now().toString(), messages: [] };
        chat.title = text.substring(0, 20) + (text.length > 20 ? '...' : '');
        if(!chatHistory.includes(chat)) chatHistory.unshift(chat);
        currentChatId = chat.id;
    }

    const currentChat = chatHistory.find(c => c.id === currentChatId);

    appendMessage('user', text);
    currentChat.messages.push({ role: 'user', content: text });
    
    chatInput.value = '';
    chatInput.style.height = 'auto';
    welcomeScreen.style.display = 'none';
    sendBtn.disabled = true;
    
    saveHistory();
    addThinkingAnimation();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: currentChat.messages })
        });

        if (!response.ok) throw new Error("Gagal menyambung ke server (Cek API Key Vercel)");

        removeThinkingAnimation();
        
        const aiMsgDiv = appendMessage('ai', '', true);
        let aiFullText = "";

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.choices && data.choices[0].delta.content) {
                            aiFullText += data.choices[0].delta.content;
                            aiMsgDiv.innerHTML = marked.parse(aiFullText);
                            autoScroll();
                        }
                    } catch (e) {
                        // ignore unparseable chunk
                    }
                }
            }
        }

        currentChat.messages.push({ role: 'assistant', content: aiFullText });
        saveHistory();

    } catch (error) {
        removeThinkingAnimation();
        appendMessage('ai', `**Waduh error cuy:** ${error.message}`);
    } finally {
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// ==========================================
// 6. EXPORT / IMPORT
// ==========================================
document.getElementById('export-btn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatHistory));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Xaerisoft_MemoryCore_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if(Array.isArray(importedData)) {
                chatHistory = importedData;
                saveHistory();
                if(chatHistory.length > 0) loadChat(chatHistory[0].id);
                alert("Memory Core berhasil dipulihkan!");
            }
        } catch (err) {
            alert("Format file salah. Pastikan file JSON asli dari Xaerisoft.");
        }
    };
    reader.readAsText(file);
});

// ==========================================
// 7. PARTICLE SYSTEM & VISUAL EFFECTS
// ==========================================
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const mouse = { x: null, y: null, radius: 150 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.color = `rgba(168, 85, 247, ${Math.random() * 0.5 + 0.2})`;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
            this.x -= directionX;
            this.y -= directionY;
        } else {
            if (this.x !== this.baseX) {
                this.x -= (this.x - this.baseX) / 10;
            }
            if (this.y !== this.baseY) {
                this.y -= (this.y - this.baseY) / 10;
            }
        }
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < 100; i++) particles.push(new Particle());
}

function connect() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 - (distance/1000)})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
    }
    connect();
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

const cursorGlow = document.getElementById('cursor-glow');
window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
    cursorGlow.style.left = e.x + 'px';
    cursorGlow.style.top = e.y + 'px';
});

// Run System
init();
if (!currentChatId) createNewChat();
