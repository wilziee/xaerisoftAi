export const config = {
  runtime: 'edge', // Wajib pakai Edge agar fitur ngetik (stream) jalan lancar
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages } = await req.json();

    // Koneksi ke Otak Groq AI
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // Model paling pintar dari Groq saat ini
        messages: messages,
        stream: true // Mode ngetik diaktifkan
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API Error: ${groqResponse.status}`);
    }

    // Lempar balasan Groq langsung ke layar kamu
    return new Response(groqResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
