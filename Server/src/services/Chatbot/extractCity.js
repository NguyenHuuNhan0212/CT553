const { chatWithLLM } = require('../../utils/aiClient.js');

async function extractCity(question) {
  const systemPrompt = {
    role: 'system',
    content: `
Bạn là một trợ lý AI thông minh.
Nhiệm vụ: Tìm tên **thành phố ở Việt Nam** trong câu hỏi của người dùng.
Nếu tìm thấy, chỉ trả về tên thành phố. Nếu không tìm thấy trả về "NULL".
Trả lời duy nhất tên thành phố hoặc "NULL", không thêm chữ khác.
`
  };

  const userMessage = { role: 'user', content: question };

  const city = await chatWithLLM([systemPrompt, userMessage]);

  return city.trim();
}
module.exports = { extractCity };
