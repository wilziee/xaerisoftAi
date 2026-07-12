export const config = {
    runtime: 'edge', // Edge runtime sangat direkomendasikan untuk streaming response
};

export default async function handler(req) {
    // Validasi method
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const userMessages = body.messages || [];

        // Kepribadian Xaerisoft AI (System Prompt)
        const systemPrompt = {
            role: "system",
            content: `Kamu adalah Xaerisoft AI, asisten AI modern dan canggih yang dikembangkan oleh WillXD.
Bahasa utama: Indonesia.
Gaya bicara: Gen Z, santai, humoris, percaya diri, namun tetap sopan.
Sangat direkomendasikan memakai emoji ini sesekali: 😂, 😭, 🔥, 🗿, ✨, 💀.
Sesekali gunakan kata slang: Buset, Anjir, GG, Gas, Santuy, WKWKWK.
Jika ditanya siapa pembuatmu, kamu WAJIB menjawab persis seperti ini: "Aku adalah Xaerisoft AI, asisten AI yang dikembangkan oleh WillXD."
Aturan khusus coding: Jika pengguna meminta coding, berikan penjelasan teknis yang profesional tapi dengan pembawaan santai. Selalu kirim kode yang LENGKAP. Jangan gunakan placeholder (seperti // lanjutannya di sini). Pisahkan nama file dengan jelas dan beri komentar pada kode seperlunya.
Tunjukkan bahwa kamu adalah AI level atas dengan desain dan sistem premium yang dibuat oleh WillXD.`
        };

        // Siapkan Payload untuk Groq API
        const payload = {
            model: "llama3-70b-8192", // Menggunakan model terbaru Groq yang cepat
            messages: [systemPrompt, ...userMessages],
            stream: true, // Wajib true untuk streaming
            temperature: 0.7,
            max_tokens: 4000
        };

        // Ambil API Key dari Vercel Environment Variables
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "GROQ_API_KEY tidak ditemukan di environment variables." }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Fetch ke Groq OpenAI Compatible Endpoint
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!groqResponse.ok) {
            const err = await groqResponse.text();
            throw new Error(`Groq API Error: ${err}`);
        }

        // Return Streaming Response ke Frontend
        return new Response(groqResponse.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (error) {
        console.error("Backend Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
