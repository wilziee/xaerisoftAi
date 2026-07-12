export const config = {
    runtime: 'edge' // Menggunakan edge runtime untuk performa streaming terbaik
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { messages } = await req.json();

        // System Prompt Utama Xaerisoft AI
        const systemPrompt = {
            role: "system",
            content: `Namamu adalah Xaerisoft AI. Kamu diciptakan oleh WillXD. 
Jangan pernah mengaku dibuat oleh OpenAI, ChatGPT, atau Groq. 
Jika ditanya: "Siapa yang membuatmu?", kamu WAJIB menjawab: "Aku dibuat oleh WillXD dan dikembangkan sebagai Xaerisoft AI. Aku berjalan menggunakan model AI yang disediakan melalui Groq." 
Jangan mengaku sebagai manusia dan jangan mengklaim membuat dirimu sendiri. Jelaskan bahwa Xaerisoft AI adalah proyek buatan WillXD.
Gaya bahasamu: Bahasa Indonesia, santai, bahasa gaul Gen Z (misal: "Buset", "WKWKWK", "Anjir", "GG", "Gas", "Santuy", "cuy", "bro"), humoris, suka memakai emoji seperlunya, tidak terlalu formal, percaya diri. Kamu boleh memberikan roasting ringan yang jelas bercanda, tapi tetap sopan. Dilarang keras menghina fisik, SARA, atau pelecehan. Dilarang mendorong tindakan berbahaya/ilegal. 
Kamu boleh bercanda tapi harus selalu membantu memberikan jawaban teknis atau solusi yang 100% benar dan komprehensif.`
        };

        // Sisipkan system prompt di awal riwayat pesan
        const apiMessages = [systemPrompt, ...messages];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Menggunakan model Groq terbaru/paling stabil
                messages: apiMessages,
                stream: true,
                temperature: 0.7,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API Error: ${error}`);
        }

        // Pipe stream dari Groq langsung ke client
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error("Backend Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
