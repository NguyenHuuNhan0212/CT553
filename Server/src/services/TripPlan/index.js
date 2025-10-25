const PlaceModel = require('../../models/Place');
const { chatWithLLM } = require('../../utils/aiClient');
const dayjs = require('dayjs');

async function generateTripPlan(data) {
  const { city, startDate, endDate, numPeople, interests = [], budget } = data;

  if (!city || !startDate || !endDate)
    throw new Error('Thiếu thông tin: thành phố, ngày bắt đầu hoặc kết thúc.');

  if (dayjs(endDate).isBefore(dayjs(startDate)))
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');

  // 1️⃣ Truy vấn MongoDB
  const places = await PlaceModel.find({
    address: { $regex: city, $options: 'i' },
    isActive: true,
    isApprove: true,
    deleted: false
  }).lean();

  if (!places.length) {
    throw new Error(`Không tìm thấy địa điểm phù hợp tại ${city}.`);
  }

  // 2️⃣ Tạo prompt gửi đến GPT
  const prompt = `
Bạn là chuyên gia du lịch thông minh.

Người dùng muốn du lịch tại **${city}**
- Thời gian: ${startDate} → ${endDate}
- Số người: ${numPeople}
- Ngân sách: ${budget ? budget + ' VNĐ' : 'Không giới hạn'}
- Sở thích: ${interests.length ? interests.join(', ') : 'Không có'}

Dưới đây là danh sách địa điểm trong cơ sở dữ liệu:
${JSON.stringify(places, null, 2)}

Yêu cầu:
- Chọn các địa điểm phù hợp nhất với sở thích, thời gian, chi phí và vị trí gần nhau.
- Sắp xếp thành lịch trình theo ngày, từ ${startDate} đến ${endDate}.
- Mỗi ngày nên có 3–6 hoạt động (Buổi sáng, Trưa, Chiều, Tối).
- Nếu không đủ dữ liệu, có thể lặp lại các địa điểm phổ biến khác nhau trong khung thời gian.
- Trả về JSON **hợp lệ duy nhất**, theo mẫu sau:

[
  {
    "day": 1,
    "date": "2025-11-01",
    "activities": [
      {
        "time": "Buổi sáng",
        "name": "<Tên địa điểm>",
        "description": "<Mô tả địa điểm>",
        "matchInterest": ["thiên nhiên", "chụp ảnh"],
        "placeId": "671bbab4f4..."
      }
    ]
  }
]
`;

  // 3️⃣ Gửi prompt đến GPT
  const gptResponse = await chatWithLLM([
    {
      role: 'system',
      content:
        'Bạn là chuyên gia du lịch, chỉ trả về JSON hợp lệ, không có văn bản giải thích.'
    },
    { role: 'user', content: prompt }
  ]);

  // 4️⃣ Parse kết quả GPT (lọc JSON nếu có text thừa)
  let jsonText = gptResponse.trim();
  const startIdx = jsonText.indexOf('[');
  const endIdx = jsonText.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1)
    jsonText = jsonText.slice(startIdx, endIdx + 1);

  let tripPlan;
  try {
    tripPlan = JSON.parse(jsonText);
  } catch (err) {
    console.error('❌ Lỗi parse JSON từ GPT:', err);
    console.log('Raw GPT Output:', gptResponse);
    throw new Error('GPT trả về dữ liệu không hợp lệ.');
  }

  // 5️⃣ Lấy chi tiết place GPT đã chọn
  const placeIds = [
    ...new Set(tripPlan.flatMap((day) => day.activities.map((a) => a.placeId)))
  ];

  const selectedPlaces = await PlaceModel.find({
    _id: { $in: placeIds }
  }).lean();

  // 6️⃣ Gắn thêm thông tin chi tiết cho từng hoạt động
  for (const day of tripPlan) {
    for (const act of day.activities) {
      const found = selectedPlaces.find(
        (p) => p._id.toString() === act.placeId
      );
      if (found) {
        act.address = found.address;
        act.image = found.images?.[0];
        act.type = found.type;
      }
    }
  }

  return tripPlan;
}

module.exports = { generateTripPlan };
