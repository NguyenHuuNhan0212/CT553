const { chatWithLLM } = require('./aiClient.js');

async function extractCity(question) {
  const systemPrompt = {
    role: 'system',
    content: `
Bạn là một trợ lý AI thông minh.
Nhiệm vụ: Tìm tên **thành phố ở Việt Nam** trong câu hỏi của người dùng.
Nếu tìm thấy, chỉ trả về tên thành phố. Nếu không tìm thấy, trả về "Cần Thơ" làm mặc định.
Trả lời duy nhất tên thành phố, không thêm chữ khác.
`
  };

  const userMessage = { role: 'user', content: question };

  const city = await chatWithLLM([systemPrompt, userMessage]);

  return city.trim();
}
module.exports = { extractCity };
