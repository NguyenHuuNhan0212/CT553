const PlaceModel = require('../../models/Place');
const { chatWithLLM } = require('../../utils/aiClient');
const dayjs = require('dayjs');
const { jsonrepair } = require('jsonrepair');

async function generateTripPlan(data) {
  const { city, startDate, endDate } = data;

  if (!city || !startDate || !endDate)
    throw new Error('Thiếu thông tin: thành phố, ngày bắt đầu hoặc kết thúc.');

  if (dayjs(endDate).isBefore(dayjs(startDate)))
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
  const numDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;

  // 1️⃣ Lấy danh sách địa điểm tại thành phố
  const places = await PlaceModel.find({
    address: { $regex: city, $options: 'i' },
    isActive: true,
    isApprove: true,
    deleted: false
  }).lean();

  if (!places.length) {
    throw new Error(`Không tìm thấy địa điểm phù hợp tại ${city}.`);
  } else {
    const placeMap = places.map((p, i) => ({
      code: `P${i + 1}`,
      id: p._id.toString(),
      name: p.name,
      type: p.type,
      services: p.services,
      images: p.images,
      address: p.address
    }));

    const prompt = `
Bạn là chuyên gia du lịch thông minh.

Người dùng muốn du lịch tại **${city}**
- Thời gian: ${startDate} → ${endDate}
- Số lượng ngày: ${numDays}
Dưới đây là danh sách địa điểm (kèm mã code):
${placeMap
  .map(
    (p) =>
      `• ${p.code} - ${p.name} (${p.type || 'unknown'}) ${p.services || []} ${
        p.address
      }`
  )
  .join('\n')}

Yêu cầu:
1. Chọn các địa điểm phù hợp nhất để tạo lịch trình du lịch thú vị, thuận tiện di chuyển.
2. Chỉ chọn **1 địa điểm có type là "hotel"** và đặt nó ở hoạt động đầu tiên của ngày đầu tiên.
   Các ngày sau **tuyệt đối không thêm địa điểm hotel**.
3. Mỗi ngày phải có **từ 4 đến 6 hoạt động**, các ngày số lượng địa điểm nên khác nhau, chia theo thời gian trong ngày:
   Buổi sáng, Trưa, Chiều, Tối (có thể thêm Sáng sớm hoặc Đêm nếu hợp lý).
4. Ưu tiên địa điểm đa dạng, nổi bật và gần nhau về vị trí.
5. Trả về JSON **hợp lệ duy nhất**, không markdown, không giải thích, theo mẫu:
[
  {
    "day": 1,
    "activities": [
      {
        "time": "Buổi sáng",
        "name": "Tên địa điểm",
        "description": "Mô tả địa điểm",
        "placeCode": "P1"
      }
    ]
  }
]
`;

    const gptResponse = await chatWithLLM([
      {
        role: 'system',
        content:
          'Bạn là chuyên gia du lịch, chỉ trả về JSON hợp lệ, không có giải thích, không markdown.'
      },
      { role: 'user', content: prompt }
    ]);

    // 5️⃣ Làm sạch và parse JSON
    let jsonText = gptResponse.trim().replace(/```json|```/g, '');
    const startIdx = jsonText.indexOf('[');
    const endIdx = jsonText.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1)
      jsonText = jsonText.slice(startIdx, endIdx + 1);

    let tripPlan;
    try {
      tripPlan = JSON.parse(jsonText);
    } catch (err) {
      try {
        tripPlan = JSON.parse(jsonrepair(jsonText));
      } catch (err2) {
        console.error('❌ GPT trả về JSON không hợp lệ:', err2.message);
        console.log('--- RAW GPT OUTPUT ---\n', gptResponse);
        throw new Error('GPT trả về dữ liệu không hợp lệ, vui lòng thử lại.');
      }
    }

    // 6️⃣ Map code -> placeId thật + gắn thông tin chi tiết
    for (const day of tripPlan) {
      for (const act of day.activities) {
        const found = placeMap.find((p) => p.code === act.placeCode);
        if (found) {
          act.placeId = found.id;
          act.address = found.address;
          act.type = found.type;
          act.services = found.services || [];
          act.image = found.images[0];
        } else {
          console.warn(`⚠ Không tìm thấy placeCode: ${act.placeCode}`);
        }
      }
    }

    return tripPlan;
  }
}

module.exports = { generateTripPlan };
