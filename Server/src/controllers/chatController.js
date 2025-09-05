// controllers/chatController.js
const ChatMessage = require('../models/ChatMessage');
const { chatWithLLM } = require('../services/Chatbot/aiClient');
const { getWeather } = require('../services/Chatbot/weather');
const { extractCity } = require('../services/Chatbot/extractCity');

async function classifyQuestion(question) {
  const systemPrompt = {
    role: 'system',
    content: `
Bạn là một trợ lý AI thân thiện và hữu ích.
Nhiệm vụ: Phân loại câu hỏi của người dùng thành 3 loại:
1. greeting → câu chào, ví dụ: "xin chào", "hello"
2. travel → câu hỏi liên quan du lịch (địa điểm, thời tiết, khách sạn, ăn uống, phương tiện, lịch trình, chi phí...)
3. other → các câu hỏi khác ngoài du lịch
Trả về duy nhất một từ: greeting, travel, hoặc other.
`
  };

  const userMessage = { role: 'user', content: question };
  const response = await chatWithLLM([systemPrompt, userMessage]);
  const category = response.trim().toLowerCase();
  if (['greeting', 'travel', 'other'].includes(category)) return category;
  return 'other';
}

function isWeatherQuestion(question) {
  const q = question.toLowerCase();
  return q.includes('thời tiết') || q.includes('weather');
}

const ask = async (req, res) => {
  try {
    const { userId, question } = req.body;
    if (!question) return res.status(400).json({ message: 'Missing question' });

    const category = await classifyQuestion(question);

    let answer = '';

    if (category === 'greeting') {
      answer = 'Chào bạn! Tôi có thể giúp bạn về du lịch. 😊';
    } else if (category === 'other') {
      answer = 'Xin lỗi, tôi chỉ có thể hỗ trợ về du lịch.';
    } else if (category === 'travel') {
      if (isWeatherQuestion(question)) {
        const city = await extractCity(question);
        try {
          answer = await getWeather(city);
        } catch (err) {
          answer = 'Xin lỗi, tôi không lấy được dữ liệu thời tiết hiện tại.';
        }
      } else {
        const history = await ChatMessage.find({ userId })
          .sort({ createdAt: -1 })
          .limit(8);
        const historyMsgs = history.reverse().map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content
        }));

        const system = {
          role: 'system',
          content: `
Bạn là một trợ lý AI thân thiện chuyên về DU LỊCH.
Trả lời các câu hỏi liên quan đến địa điểm, khách sạn, ăn uống, phương tiện, lịch trình, chi phí...
Trả lời ngắn gọn, rõ ràng, dễ hiểu và thân thiện.
Nếu câu hỏi KHÔNG liên quan đến du lịch, trả lời: "Xin lỗi, tôi chỉ có thể hỗ trợ về du lịch."
`
        };

        const messages = [
          ...historyMsgs,
          system,
          { role: 'user', content: question }
        ];
        answer = await chatWithLLM(messages);
      }
    }

    await ChatMessage.create({
      userId: userId || null,
      role: 'user',
      content: question
    });
    await ChatMessage.create({
      userId: userId || null,
      role: 'assistant',
      content: answer
    });

    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { ask };
