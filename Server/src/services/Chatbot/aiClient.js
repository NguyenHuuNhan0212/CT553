require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chatWithLLM(messages) {
  if (!process.env.OPENAI_API_KEY) return 'AI key not provided (no response)';
  const resp = await client.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
    messages,
    temperature: 0.7
  });
  return resp.choices?.[0]?.message?.content || '';
}

module.exports = { chatWithLLM };
