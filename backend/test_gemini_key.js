const env = require('./src/config/env');

const apiKey = env.GEMINI_API_KEY;
const model = env.GEMINI_MODEL || 'gemini-2.5-flash';

console.log('API Key:', apiKey);
console.log('Model:', model);

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Hello' }]
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    console.log('Status Code:', res.statusCode || res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during fetch:', err);
  }
}

test();
