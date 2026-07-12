// script.js

// Konfigurasi Marked.js untuk Syntax Highlighting
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// State Management
let chatHistory = [];
let currentChatId = null;

// Elemen DOM
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const historyList = document.getElementById('chat-history-list');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

// Inisialisasi
function init() {
    loadHistoryFromStorage();
    if (chatHistory.length === 0) {
        startNewChat();
    } else {
        loadChat(chatHistory[0].id);
    }
    renderHistoryList();
}

// Auto Resize Textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Mobile Menu Toggle
mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Tutup sidebar jika klik di luar (Mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// Chat Logics
function startNewChat() {
    currentChatId = Date.now().toString();
    const newChat = {
        id: currentChatId,
        title: "Chat Baru",
        messages: []
    };
    chatHistory.unshift(newChat);
    saveHistoryToStorage();
    renderHistoryList();
    clearChatBox();
    showWelcomeMessage();
}

newChatBtn.addEventListener('click', startNewChat);

function loadChat(id) {
    currentChatId = id;
    clearChatBox();
    const chat = chatHistory.find(c => c.id === id);
    if (chat && chat.messages.length > 0) {
        chat.messages.forEach(msg => {
            appendMessage(msg.role, msg.content, false);
        });
    } else {
        showWelcomeMessage();
    }
    renderHistoryList();
}

function clearChatBox() {
    chatBox.innerHTML = '';
}

function showWelcomeMessage() {
    const html = `
        <div class="message ai glass-msg">
            <div class="avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="message-content">
                <p>Yo! Xaerisoft AI di sini 🚀 Ada yang bisa gue bantu hari ini cuy?</p>
            </div>
        </div>
    `;
    chatBox.insertAdjacentHTML('beforeend', html);
}

// Render History
function renderHistoryList() {
    historyList.innerHTML = '';
    chatHistory.forEach(chat => {
        const li = document.createElement('li');
        li.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        li.textContent = chat.title;
        li.onclick = () => {
            loadChat(chat.id);
            if(window.innerWidth <= 768) sidebar.classList.remove('open');
        };
        historyList.appendChild(li);
    });
}

// Form Submit (Kirim Pesan)
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Reset Input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Tampilkan pesan User
    appendMessage('user', text, true);
    
    // Update State
    const chat = chatHistory.find(c => c.id === currentChatId);
    chat.messages.push({ role: 'user', content: text });
    
    // Update Judul otomatis jika ini pesan pertama
    if (chat.messages.length === 1) {
        chat.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        renderHistoryList();
    }
    saveHistoryToStorage();

    // Tampilkan indikator "Berpikir"
    const thinkingId = appendThinkingIndicator();
    scrollToBottom();

    // Request ke Backend API Vercel
    try {
        // Ambil hanya riwayat pesan untuk API
        const messagesForApi = chat.messages.map(m => ({ role: m.role, content: m.content }));
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messagesForApi })
        });

        if (!response.ok) throw new Error('API Error');

        // Hapus indikator "Berpikir"
        removeElement(thinkingId);
        
        // Buat elemen penampung stream AI
        const messageContainerId = `msg-${Date.now()}`;
        createEmptyAiMessage(messageContainerId);
        
        // Parsing Streaming Response (SSE)
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let aiFullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const delta = data.choices[0].delta.content;
                        if (delta) {
                            aiFullText += delta;
                            updateAiMessage(messageContainerId, aiFullText);
                            scrollToBottom();
                        }
                    } catch (err) {
                        console.error('Stream parsing error:', err);
                    }
                }
            }
        }

        // Simpan jawaban AI ke State
        chat.messages.push({ role: 'assistant', content: aiFullText });
        saveHistoryToStorage();
        
        // Tambahkan tombol copy ke block kode yang baru selesai di-render
        addCopyButtonsToCodeBlocks();

    } catch (error) {
        removeElement(thinkingId);
        appendMessage('assistant', `Yah gagal cuy 😭 Server lagi error nih: ${error.message}`, true);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
});

// UI Helpers
function appendMessage(role, content, animate = false) {
    const isUser = role === 'user';
    const avatarIcon = isUser ? 'fa-user' : 'fa-robot';
    
    // Parse Markdown dan bersihkan HTML
    const rawHtml = isUser ? escapeHTML(content) : marked.parse(content);
    const safeHtml = DOMPurify.sanitize(rawHtml);

    const div = document.createElement('div');
    div.className = `message ${role} glass-msg`;
    if (!animate) div.style.animation = 'none'; // Matikan animasi jika dari history

    div.innerHTML = `
        <div class="avatar"><i class="fa-solid ${avatarIcon}"></i></div>
        <div class="message-content">${safeHtml}</div>
    `;
    chatBox.appendChild(div);
    addCopyButtonsToCodeBlocks();
    scrollToBottom();
}

function createEmptyAiMessage(id) {
    const div = document.createElement('div');
    div.className = `message ai glass-msg`;
    div.id = id;
    div.innerHTML = `
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-content"></div>
    `;
    chatBox.appendChild(div);
}

function updateAiMessage(id, content) {
    const el = document.getElementById(id);
    if (el) {
        const contentEl = el.querySelector('.message-content');
        contentEl.innerHTML = DOMPurify.sanitize(marked.parse(content));
    }
}

function appendThinkingIndicator() {
    const id = `thinking-${Date.now()}`;
    const div = document.createElement('div');
    div.className = `message ai glass-msg`;
    div.id = id;
    div.innerHTML = `
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    chatBox.appendChild(div);
    return id;
}

function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Copy Code Feature
function addCopyButtonsToCodeBlocks() {
    const blocks = document.querySelectorAll('pre');
    blocks.forEach(block => {
        // Hindari duplikasi tombol
        if (block.querySelector('.copy-btn')) return;
        
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
        
        btn.addEventListener('click', () => {
            const code = block.querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                }, 2000);
            });
        });
        block.appendChild(btn);
    });
}

// LocalStorage Handlers
function saveHistoryToStorage() {
    localStorage.setItem('xaerisoft_chats', JSON.stringify(chatHistory));
}

function loadHistoryFromStorage() {
    const stored = localStorage.getItem('xaerisoft_chats');
    if (stored) {
        try {
            chatHistory = JSON.parse(stored);
        } catch (e) {
            chatHistory = [];
        }
    }
}

// Import / Export JSON
exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatHistory));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Xaerisoft_Chat_Backup_${new Date().toLocaleDateString()}.json`);
    dlAnchorElem.click();
});

importBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                chatHistory = imported;
                saveHistoryToStorage();
                init();
                alert("GG! Berhasil import chat cuy 🚀");
            } else {
                alert("Format file salah cuy!");
            }
        } catch(err) {
            alert("Gagal parsing JSON: " + err.message);
        }
    };
    reader.readAsText(file);
    importFile.value = ''; // Reset
});

// Run Init
init();

// Deteksi Enter untuk kirim (Shift+Enter untuk baris baru)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});
