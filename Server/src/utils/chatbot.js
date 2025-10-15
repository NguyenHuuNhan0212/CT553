const { chatWithLLM } = require('../services/Chatbot/aiClient');
const Place = require('../models/Place');
// Phân loại intent
async function classifyQuestion(question) {
  const systemPrompt = {
    role: 'system',
    content: `
Bạn là một trợ lý AI thân thiện và hữu ích.
Phân loại câu hỏi người dùng thành 4 loại:
1. greeting → câu chào
2. travel → câu hỏi liên quan du lịch (địa điểm, thời tiết, khách sạn, ăn uống, phương tiện, lịch trình, chi phí...)
3. plan_trip →  yêu cầu tạo lịch trình du lịch (ví dụ: "lập kế hoạch đi Cần Thơ 2 ngày 1 đêm")
4. other → các câu hỏi khác ngoài du lịch
Trả về duy nhất 1 từ: greeting, travel, plan_trip, other
`
  };
  const userMessage = { role: 'user', content: question };
  const response = await chatWithLLM([systemPrompt, userMessage]);
  const category = response.trim().toLowerCase();
  if (['greeting', 'travel', 'plan_trip', 'other'].includes(category))
    return category;
  return 'other';
}

// Kiểm tra câu hỏi về thời tiết
function isWeatherQuestion(question) {
  const q = question.toLowerCase();
  return q.includes('thời tiết') || q.includes('weather');
}
// Hàm trộn mảng
function shuffleArray(array) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

// Tạo lịch trình từ Place với phân chia thời gian
function pickMultiple(list, backupList, count = 1) {
  const results = [];

  for (let i = 0; i < count; i++) {
    if (list.length) {
      results.push(list.pop());
    } else if (backupList.length) {
      // refill từ backup
      list.push(...shuffleArray(backupList));
      results.push(list.pop());
    }
  }

  return results.filter(Boolean);
}
// Hàm tính chi phí trung bình
const getAvgCost = (place) => {
  if (place.hotelDetail?.roomTypes?.length)
    return Math.round(
      place.hotelDetail.roomTypes.reduce(
        (a, r) => a + (r.pricePerNight || 0),
        0
      ) / place.hotelDetail.roomTypes.length
    );
  if (place.services?.length)
    return Math.round(
      place.services.reduce((a, s) => a + (s.price || 0), 0) /
        place.services.length
    );
  return 0;
};
async function createTripPlan(city, numDays = 1) {
  const places = await Place.find({
    address: { $regex: city, $options: 'i' }
  });

  if (!places.length) return null;

  // Phân loại
  const hotels = shuffleArray(places.filter((p) => p.type === 'hotel'));
  const restaurants = shuffleArray(
    places.filter((p) => p.type === 'restaurant' || p.type === 'cafe')
  );
  const attractions = shuffleArray(
    places.filter((p) => p.type === 'touristSpot')
  );

  // Backup
  const backupHotels = [...hotels];
  const backupRestaurants = [...restaurants];
  const backupAttractions = [...attractions];

  const plan = [];

  for (let day = 1; day <= numDays; day++) {
    const dayPlan = { day, activities: [] };

    // Chọn ngẫu nhiên 4–6 địa điểm (bao gồm cả ăn uống)
    const dayAttractions = pickMultiple(attractions, backupAttractions, 3);
    const dayRestaurants = pickMultiple(restaurants, backupRestaurants, 2);
    const mixed = shuffleArray([...dayAttractions, ...dayRestaurants]).slice(
      0,
      Math.floor(Math.random() * 3) + 3 // random 3–6 địa điểm/ngày
    );

    mixed.forEach((p) =>
      dayPlan.activities.push({
        name: p.name,
        address: p.address,
        cost: getAvgCost(p),
        type: p.type
      })
    );

    // Gợi ý khách sạn (mỗi ngày 1 cái)
    const hotel = hotels.pop() || backupHotels.pop();
    if (hotel) {
      dayPlan.activities.push({
        name: hotel.name,
        address: hotel.address,
        cost: getAvgCost(hotel),
        type: 'hotel'
      });
    }

    plan.push(dayPlan);
  }

  return plan;
}

async function formatTripPlanWithGPT(tripPlan, numDays, city) {
  const messages = [
    {
      role: 'system',
      content: `
Bạn là một trợ lý du lịch thân thiện, hãy trình bày lịch trình ngắn gọn và tự nhiên như đang tư vấn.
Không chia buổi sáng/trưa/chiều/tối, chỉ cần mô tả theo ngày với danh sách các địa điểm gợi ý.
Dùng markdown và emoji cho dễ đọc.
`
    },
    {
      role: 'user',
      content: `
Đây là dữ liệu JSON của lịch trình ${numDays} ngày ở ${city}:\n
${JSON.stringify(tripPlan, null, 2)}\n

Yêu cầu:
- Mỗi ngày hiển thị các địa điểm gợi ý theo thứ tự hợp lý.
- Kiểm tra địa chỉ "address" để đưa ra lịch trình hợp lý nhất.
- Gợi ý thêm vài cảm xúc/nhận xét tự nhiên như "thử đặc sản", "check-in sống ảo", "nghỉ ngơi thư giãn" v.v.
- Nếu có khách sạn, hãy ghi rõ "Gợi ý nghỉ đêm tại..." ở cuối ngày.
- Trả lời thân thiện thêm cảm xúc tự nhiên.
- Luôn luôn đưa chi phí ước tính vào từng địa điểm nếu không có hãy để là miễn phí.
- Cuối cùng thêm lưu ý: *Chi phí chỉ mang tính ước lượng, có thể thay đổi tùy mùa và lựa chọn thực tế.*`
    }
  ];

  const reply = await chatWithLLM(messages);
  return reply;
}

function isPlaceListQuestion(question) {
  const q = question.toLowerCase();
  return (
    q.includes('khách sạn') ||
    q.includes('hotel') ||
    q.includes('nhà hàng') ||
    q.includes('địa điểm ăn uống') ||
    q.includes('quán ăn') ||
    q.includes('cafe') ||
    q.includes('quán cà phê') ||
    q.includes('điểm vui chơi') ||
    q.includes('điểm tham quan') ||
    q.includes('điểm du lịch') ||
    q.includes('tourist spot')
  );
}

module.exports = {
  classifyQuestion,
  isWeatherQuestion,
  createTripPlan,
  formatTripPlanWithGPT,
  isPlaceListQuestion,
  getAvgCost
};
