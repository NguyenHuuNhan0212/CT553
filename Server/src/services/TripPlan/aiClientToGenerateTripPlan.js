require('dotenv').config();
const OpenAI = require('openai');
const { sanitizeJsonOutput } = require('../../utils/sanitizeJson');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function generateTripPlanWithAI(city, aiInput) {
  const prompt = `
Tôi có danh sách địa điểm tại ${city} từ CSDL:

Tourist Spots:
${aiInput.grouped.touristSpot
  .map(
    (p) =>
      `- ID: ${p.id}, Name: ${p.name}, Address: ${p.address}, AvgPrice: ${p.avgPrice}, Description: ${p.description}`
  )
  .join('\n')}

Cafes:
${aiInput.grouped.cafe
  .map(
    (p) =>
      `- ID: ${p.id}, Name: ${p.name}, Address: ${p.address}, AvgPrice: ${p.avgPrice}, Description: ${p.description}`
  )
  .join('\n')}

Restaurants:
${aiInput.grouped.restaurant
  .map(
    (p) =>
      `- ID: ${p.id}, Name: ${p.name}, Address: ${p.address}, AvgPrice: ${p.avgPrice}, Description: ${p.description}`
  )
  .join('\n')}

Hotels:
${aiInput.grouped.hotel
  .map(
    (h) =>
      `- ID: ${h.id}, Name: ${h.name}, Address: ${h.address}, AvgPrice: ${h.avgPrice}, Description: ${h.description}`
  )
  .join('\n')}

Yêu cầu:
- Tạo lịch trình ${aiInput.numDays} ngày.
- Mỗi ngày có 4 phần: morning, noon, afternoon, evening.
- morning & afternoon: chọn 2–3 địa điểm CHỈ từ (touristSpot/cafe). KHÔNG được chọn hotel hoặc restaurant.
- noon: luôn có ít nhất 1 restaurant, có thể thêm 1 cafe. KHÔNG được chọn hotel hoặc touristSpot.
- evening:
   {
     "dinner": luôn có ít nhất 1 restaurant (CHỈ chọn từ restaurant, không được chọn loại khác, tái sử dụng nếu cần),
     "hotel_options": luôn có 2–3 khách sạn (CHỈ chọn từ hotel, tái sử dụng nếu thiếu).
   }
- KHÔNG được để trống, KHÔNG được ghi "Chưa có gợi ý".
- BẮT BUỘC tên địa điểm phải có loại gì ví dụ: mộc (cafe), Mường thanh (hotel),...
- Cố gắng thêm nhiều nhất có thể các địa điểm chứ đừng để lặp lại quá nhiều.
- Nếu dữ liệu ít, bắt buộc phải tái sử dụng để lấp đầy tất cả buổi trong tất cả ngày.
- Mỗi địa điểm phải giữ nguyên thông tin gốc (id, name, address, avgPrice, description).
- Mỗi địa điểm KHÔNG được xuất hiện quá 2 lần trong toàn bộ lịch trình. Nếu thiếu dữ liệu, hãy ưu tiên xoay vòng giữa các địa điểm có sẵn thay vì lặp đi lặp lại cùng một địa điểm quá nhiều.
- Ưu tiên phân bổ đều tất cả địa điểm có trong danh sách.
- Không được thêm chú thích, comment, hoặc text ngoài JSON.
- Mọi field không có dữ liệu vẫn phải trả về object/array hợp lệ.
- Output phải là JSON thuần (không markdown, không text khác).

- Format:
{
  "day1": { "morning": [...], "noon": [...], "afternoon": [...], "evening": { "dinner": [...], "hotel_options": [...] } },
  "day2": {...},
  ...
  "day${aiInput.numDays}": {...}
}

`;

  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  });

  let content = response.choices[0].message.content;
  content = sanitizeJsonOutput(content);

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('JSON parse error:', err.message);
    console.error('Raw content:', content);
    throw err;
  }
}

module.exports = { generateTripPlanWithAI };
