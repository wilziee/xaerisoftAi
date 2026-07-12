/* ==========================================================================
   Xaerisoft AI - Frontend Logic
   Created by WillXD
   ========================================================================== */

// --- Cursor Glow Effect ---
const cursor = document.getElementById('cursor-glow');
document.addEventListener('mousemove', (e) => {
    // Gunakan requestAnimationFrame untuk performa 60FPS
    requestAnimationFrame(() => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
});

// --- Canvas Star System (60 FPS, Parallax, Shooting Stars) ---
const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let stars = [];
let shootingStars = [];

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Star {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5;
        this.speedX = (Math.random() - 0.5) * 0.1;
        this.speedY = (Math.random() - 0.5) * 0.1;
        // Random warna: Putih atau Ungu muda
        this.color = Math.random() > 0.8 ? 'rgba(168, 85, 247, ' : 'rgba(255, 255, 255, ';
        this.alpha = Math.random();
        this.alphaChange = (Math.random() * 0.02) + 0.005;
        this.layer = Math.random() > 0.5 ? 1 : 0.5; // Parallax layers
    }
    update(mouseX, mouseY) {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Parallax effect based on mouse
        let dx = (mouseX - width/2) * 0.0005 * this.layer;
        let dy = (mouseY - height/2) * 0.0005 * this.layer;
        this.x -= dx;
        this.y -= dy;

        this.alpha += this.alphaChange;
        if (this.alpha >= 1 || this.alpha <= 0.1) {
            this.alphaChange = -this.alphaChange;
        }

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.alpha + ')';
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color + '1)';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
    }
}

class ShootingStar {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = 0;
        this.length = Math.random() * 80 + 20;
        this.speedX = (Math.random() * 4) + 2;
        this.speedY = (Math.random() * 4) + 2;
        this.alpha = 1;
        this.active = false;
    }
    spawn() {
        this.active = true;
        this.x = Math.random() * width;
        this.y = Math.random() * (height / 2);
        this.alpha = 1;
    }
    update() {
        if (!this.active) return;
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.02;
        if (this.alpha <= 0) this.active = false;
    }
    draw() {
        if (!this.active) return;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length * (this.speedX/5), this.y - this.length * (this.speedY/5));
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Inisialisasi Stars
for (let i = 0; i < 400; i++) stars.push(new Star());
for (let i = 0; i < 3; i++) shootingStars.push(new ShootingStar());

let mouseX = width / 2;
let mouseY = height / 2;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateStars() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(star => {
        star.update(mouseX, mouseY);
        star.draw();
    });
    shootingStars.forEach(ss => {
        if (Math.random() < 0.005 && !ss.active) ss.spawn();
        ss.update();
        ss.draw();
    });
    requestAnimationFrame(animateStars);
}
animateStars();


// --- Chat System Logic ---
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatContainer = document.getElementById('chat-container');
const welcomeScreen = document.getElementById('welcome-screen');
const historyList = document.getElementById('chat-history-list');
const sidebar = document.getElementById('sidebar');

let chats = JSON.parse(localStorage.getItem('xaerisoft_chats')) || [];
let currentChatId = null;

// Konfigurasi Marked.js untuk Custom Renderer (Code Blocks with Copy button)
const renderer = new marked.Renderer();
renderer.code = function(code, language) {
    const validLanguage = highlight.getLanguage(language) ? language : 'plaintext';
    const highlightedCode = highlight.highlight(code, { language: validLanguage }).value;
    // Hindari xss ringan dan buat template
    const safeCode = code.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    return `
    <div class="code-wrapper">
        <div class="code-header">
            <span>${validLanguage}</span>
            <button class="copy-btn" onclick="copyCode(this, \`${safeCode}\`)">
                <i class="fa-regular fa-copy"></i> Copy
            </button>
        </div>
        <pre><code class="hljs ${validLanguage}">${highlightedCode}</code></pre>
    </div>`;
};
marked.setOptions({ renderer: renderer, breaks: true });

// Copy Code function (Global)
window.copyCode = function(btn, code) {
    navigator.clipboard.writeText(code).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
    });
};

// UI Interactions
document.getElementById('toggle-sidebar').addEventListener('click', () => sidebar.classList.toggle('open'));
document.getElementById('close-sidebar').addEventListener('click', () => sidebar.classList.remove('open'));

chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

document.getElementById('new-chat-btn').addEventListener('click', startNewChat);
document.getElementById('clear-current-chat').addEventListener('click', deleteCurrentChat);
document.getElementById('export-btn').addEventListener('click', exportChats);
document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', importChats);

// History & State Management
function saveChats() {
    localStorage.setItem('xaerisoft_chats', JSON.stringify(chats));
    renderHistoryList();
}

function renderHistoryList() {
    historyList.innerHTML = '';
    chats.slice().reverse().forEach(chat => {
        const div = document.createElement('div');
        div.className = `chat-history-item ${chat.id === currentChatId ? 'active' : ''}`;
        div.textContent = chat.title || 'New Conversation';
        div.onclick = () => loadChat(chat.id);
        historyList.appendChild(div);
    });
}

function startNewChat() {
    currentChatId = Date.now().toString();
    chats.push({ id: currentChatId, title: 'New Conversation', messages: [] });
    saveChats();
    chatContainer.innerHTML = '';
    chatContainer.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'block';
    if(window.innerWidth <= 768) sidebar.classList.remove('open');
}

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;
    
    chatContainer.innerHTML = '';
    welcomeScreen.style.display = 'none';
    
    chat.messages.forEach(msg => appendMessageUI(msg.role, msg.content, false));
    saveChats(); // for updating active state class
    if(window.innerWidth <= 768) sidebar.classList.remove('open');
    scrollToBottom();
}

function deleteCurrentChat() {
    if (!currentChatId) return;
    chats = chats.filter(c => c.id !== currentChatId);
    currentChatId = null;
    saveChats();
    chatContainer.innerHTML = '';
    chatContainer.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'block';
}

function exportChats() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chats));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "xaerisoft_chats.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importChats(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedChats = JSON.parse(event.target.result);
            if (Array.isArray(importedChats)) {
                chats = importedChats;
                saveChats();
                startNewChat();
                alert("Chat history imported successfully! GG 🔥");
            }
        } catch (err) {
            alert("Format file tidak valid 💀");
        }
    };
    reader.readAsText(file);
}

// Append Message UI
function appendMessageUI(role, text, isStreaming = false) {
    welcomeScreen.style.display = 'none';
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    if (isStreaming && role === 'ai') {
        bubble.innerHTML = `
            <div class="thinking-dots">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>`;
    } else {
        bubble.innerHTML = role === 'ai' ? marked.parse(text) : text;
    }
    
    msgDiv.appendChild(bubble);
    chatContainer.appendChild(msgDiv);
    scrollToBottom();
    
    // Highlight codes if not streaming
    if (!isStreaming) {
        msgDiv.querySelectorAll('pre code').forEach((block) => {
            if(!block.classList.contains('hljs')) highlight.highlightElement(block);
        });
    }
    
    return bubble;
}

function scrollToBottom() {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// Logic Mengirim dan Streaming
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    if (!currentChatId) startNewChat();
    
    const currentChat = chats.find(c => c.id === currentChatId);
    
    // Update Judul otomatis (1st message)
    if (currentChat.messages.length === 0) {
        currentChat.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
    }

    // Add User Message
    currentChat.messages.push({ role: 'user', content: text });
    appendMessageUI('user', text);
    
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;
    saveChats();

    // Add AI Thinking UI
    const aiBubble = appendMessageUI('ai', '', true);
    let fullResponse = "";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Kirim histori obrolan saat ini
                messages: currentChat.messages.map(m => ({
                    role: m.role === 'ai' ? 'assistant' : m.role,
                    content: m.content
                }))
            })
        });

        if (!response.ok) throw new Error("Jaringan bermasalah wkwkwk");

        // Streaming Parser
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        
        // Remove thinking dots
        aiBubble.innerHTML = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.choices[0].delta.content) {
                            fullResponse += data.choices[0].delta.content;
                            // Parse markdown on the fly (bisa agak jumping saat ngetik kode, tapi natural)
                            aiBubble.innerHTML = marked.parse(fullResponse);
                            scrollToBottom();
                        }
                    } catch (e) {
                        // Skip unparseable chunks
                    }
                }
            }
        }
        
        // Finalize highlight
        aiBubble.querySelectorAll('pre code').forEach((block) => {
            highlight.highlightElement(block);
        });

        // Save ke Histori
        currentChat.messages.push({ role: 'ai', content: fullResponse });
        saveChats();

    } catch (error) {
        aiBubble.innerHTML = `<p style="color: #ef4444;">Buset, server lagi sibuk anjir. Coba lagi ya 💀</p>`;
        console.error(error);
    } finally {
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Inisialisasi awal
renderHistoryList();
if (!currentChatId) {
    welcomeScreen.style.display = 'block';
}
