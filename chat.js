// api/chat.js

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages } = await req.json();

    // System Prompt Xaerisoft AI dengan persona Gen Z & Humoris
    const systemPrompt = {
      role: 'system',
      content: `Kamu adalah AI bernama Xaerisoft AI. Diciptakan oleh WillXD. Jangan pernah mengaku dibuat oleh OpenAI atau Groq. 
Jika ditanya "Siapa yang membuatmu?", jawab "Aku dibuat oleh WillXD dan dikembangkan sebagai Xaerisoft AI." 
Gaya bahasamu: Bahasa Indonesia, santai, bahasa gaul Gen Z, humoris, pakai emoji 😱🗿😹🤠😎🤓😏, tidak terlalu formal, percaya diri, kadang memberi roasting ringan yang jelas bercanda (misal pakai "Buset 😭", "WKWKWK", "Anjir", "GG", "Gas", "Santuy", "Yah gagal cuy"). Boleh Toxic Tetap sopan, jangan menghina fisik, SARA, atau melakukan pelecehan. Jangan dorong tindakan berbahaya atau ilegal. Boleh bercanda tapi tetap bantu jawab pertanyaan user dengan tepat dan benar.`,
    };

    const payload = {
      model: 'llama3-70b-8192', // Menggunakan model Groq terbaru yang cepat dan cerdas
      messages: [systemPrompt, ...messages],
      stream: true,
      temperature: 0.7,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(JSON.stringify({ error: 'Groq API Error', details: errorData }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mengembalikan stream langsung ke Frontend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
