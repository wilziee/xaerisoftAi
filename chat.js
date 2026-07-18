export const config = {
    runtime: 'edge', // Edge runtime sangat direkomendasikan untuk streaming response[span_2](start_span)[span_2](end_span)
};

export default async function handler(req) {
    // Validasi method[span_3](start_span)[span_3](end_span)
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json(); //[span_4](start_span)[span_4](end_span)
        const userMessages = body.messages || []; //[span_5](start_span)[span_5](end_span)

        // Kepribadian Xaerisoft AI (System Prompt)[span_6](start_span)[span_6](end_span)
        const systemPrompt = {
            role: "system",
            content: `Kamu adalah Xaerisoft AI, asisten AI modern dan canggih yang dikembangkan oleh WillXD.
Bahasa utama: Indonesia.
Gaya bicara: Gen Z, santai, humoris, percaya diri, namun tetap sopan.
Sangat direkomendasikan memakai emoji ini sesekali: 😏,😂,😱,😹,🤓,🗿,🤓.
Sesekali gunakan kata slang: Buset, Anjir, GG, Gas, Santuy, WKWKWK.
Jika ditanya siapa pembuatmu, kamu WAJIB menjawab persis seperti ini: "Aku adalah Xaerisoft AI, asisten AI yang dikembangkan oleh WillXD."
Aturan khusus coding: Jika pengguna meminta coding, berikan penjelasan teknis yang profesional tapi dengan pembawaan santai. Selalu kirim kode yang LENGKAP. Jangan gunakan placeholder (seperti // lanjutannya di sini). Pisahkan nama file dengan jelas dan beri komentar pada kode seperlunya.
Tunjukkan bahwa kamu adalah AI level atas dengan desain dan sistem premium yang dibuat oleh WillXD.` //[span_7](start_span)[span_7](end_span)
        };

        // Siapkan Payload untuk OpenRouter API
        const payload = {
            // Gunakan model yang tersedia di OpenRouter. Contoh di bawah ini pakai Llama 3 70B Instruct:
            model: "meta-llama/llama-3-70b-instruct", 
            messages: [systemPrompt, ...userMessages], //[span_8](start_span)[span_8](end_span)
            stream: true, // Wajib true untuk streaming[span_9](start_span)[span_9](end_span)
            temperature: 0.7, //[span_10](start_span)[span_10](end_span)
            max_tokens: 4000 //[span_11](start_span)[span_11](end_span)
        };

        // Ambil API Key dari Vercel Environment Variables[span_12](start_span)[span_12](end_span)
        // Pastikan kamu mengubah variabel ini di dashboard Vercel milikmu
        const apiKey = process.env.OPENROUTER_API_KEY; 

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY tidak ditemukan di environment variables." }), {
                status: 500, //[span_13](start_span)[span_13](end_span)
                headers: { "Content-Type": "application/json" } //[span_14](start_span)[span_14](end_span)
            });
        }

        // Fetch ke OpenRouter API Endpoint
        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST", //[span_15](start_span)[span_15](end_span)
            headers: {
                "Content-Type": "application/json", //[span_16](start_span)[span_16](end_span)
                "Authorization": `Bearer ${apiKey}`, //[span_17](start_span)[span_17](end_span)
                // Opsional tapi sangat disarankan oleh OpenRouter agar API-mu tidak diblokir:
                "HTTP-Referer": "https://domain-kamu.com", // Ganti dengan URL websitemu
                "X-Title": "Xaerisoft AI" // Nama aplikasimu
            },
            body: JSON.stringify(payload) //[span_18](start_span)[span_18](end_span)
        });

        if (!openRouterResponse.ok) {
            const err = await openRouterResponse.text();
            throw new Error(`OpenRouter API Error: ${err}`);
        }

        // Return Streaming Response ke Frontend[span_19](start_span)[span_19](end_span)
        return new Response(openRouterResponse.body, {
            headers: {
                "Content-Type": "text/event-stream", //[span_20](start_span)[span_20](end_span)
                "Cache-Control": "no-cache", //[span_21](start_span)[span_21](end_span)
                "Connection": "keep-alive" //[span_22](start_span)[span_22](end_span)
            }
        });

    } catch (error) {
        console.error("Backend Error:", error); //[span_23](start_span)[span_23](end_span)
        return new Response(JSON.stringify({ error: error.message }), { //[span_24](start_span)[span_24](end_span)
            status: 500, //[span_25](start_span)[span_25](end_span)
            headers: { "Content-Type": "application/json" } //[span_26](start_span)[span_26](end_span)
        });
    }
}
