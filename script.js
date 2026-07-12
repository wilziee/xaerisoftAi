/**
 * XAERISOFT UNIVERSE ENGINE
 * Visual Layer & Animations
 */

// --- 1. Particle System Engine ---
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
                let dx = this.x - this.baseX;
                this.x -= dx / 10;
            }
            if (this.y !== this.baseY) {
                let dy = this.y - this.baseY;
                this.y -= dy / 10;
            }
        }
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
    }
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

// --- 2. Cursor Glow Effect ---
const cursorGlow = document.getElementById('cursor-glow');
window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
    cursorGlow.style.left = e.x + 'px';
    cursorGlow.style.top = e.y + 'px';
});

// --- 3. UI Interactions ---
const navbar = document.getElementById('navbar');
const chatBoxContainer = document.getElementById('chat-box');

chatBoxContainer.addEventListener('scroll', () => {
    if (chatBoxContainer.scrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

function setQuickInput(text) {
    const input = document.getElementById('chat-input');
    input.value = text;
    input.dispatchEvent(new Event('input'));
    input.focus();
}

// --- LOGIC BRIDGE (Menghubungkan ke Logic yang sudah ada) ---
// Note: Kode di bawah adalah penghubung agar desain baru bekerja dengan script lama

// Re-map marked renderer for premium code blocks
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

const renderer = new marked.Renderer();
renderer.code = (code, language) => {
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

// Tambahkan observer untuk animasi masuk pesan
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
        }
    });
}, observerOptions);

// Fungsi pembantu untuk mengaktifkan observer pada pesan baru
function observeMessages() {
    document.querySelectorAll('.message').forEach(m => observer.observe(m));
}

// Integrasi ke fungsi sendMessage lama (Logic Override ringan tanpa mengubah inti)
const originalAppendMessage = window.appendMessage;
window.appendMessage = function(role, text, isStream = false) {
    const res = originalAppendMessage(role, text, isStream);
    observeMessages();
    return res;
};

// Inisialisasi ulang komponen sidebar pada desain baru
document.getElementById('toggle-sidebar').onclick = () => {
    document.getElementById('sidebar').classList.toggle('open');
};

document.getElementById('close-sidebar').onclick = () => {
    document.getElementById('sidebar').classList.remove('open');
};
