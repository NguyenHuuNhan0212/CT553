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

// Hàm tính độ giống nhau giữa 2 chuỗi (tỉ lệ match)
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  let matches = 0;
  const minLen = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLen; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  return matches / minLen;
}

// Chọn hotel gần nhất so với address của place tối
function findNearestHotel(hotels, eveningPlace) {
  if (!hotels.length || !eveningPlace?.address) return null;

  let bestHotel = hotels[0];
  let bestScore = 0;

  hotels.forEach((hotel) => {
    const score = stringSimilarity(eveningPlace.address, hotel.address);
    if (score > bestScore) {
      bestScore = score;
      bestHotel = hotel;
    }
  });

  return bestHotel;
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

async function createTripPlan(city, numDays = 1) {
  const places = await Place.find({ address: { $regex: city, $options: 'i' } });
  if (!places.length) return null;

  let hotels = shuffleArray(places.filter((p) => p.type === 'hotel'));
  let restaurants = shuffleArray(places.filter((p) => p.type === 'restaurant'));
  let attractions = shuffleArray(
    places.filter((p) => p.type !== 'hotel' && p.type !== 'restaurant')
  );

  // Giữ backup để có thể reuse
  const backupHotels = [...hotels];
  const backupRestaurants = [...restaurants];
  const backupAttractions = [...attractions];

  const plan = [];

  for (let day = 1; day <= numDays; day++) {
    const dayPlan = { day, activities: [] };

    // Sáng (2 option)
    const morningOptions = pickMultiple(attractions, backupAttractions, 2);
    morningOptions.forEach((opt) =>
      dayPlan.activities.push({
        time: 'Sáng',
        ...opt.toObject(),
        cost: opt.avgPrice || 0
      })
    );

    // Trưa (2 option)
    const lunchOptions = pickMultiple(restaurants, backupRestaurants, 2);
    lunchOptions.forEach((opt) =>
      dayPlan.activities.push({
        time: 'Trưa',
        ...opt.toObject(),
        cost: opt.avgPrice || 0
      })
    );

    // Chiều (2 option)
    const afternoonOptions = pickMultiple(attractions, backupAttractions, 2);
    afternoonOptions.forEach((opt) =>
      dayPlan.activities.push({
        time: 'Chiều',
        ...opt.toObject(),
        cost: opt.avgPrice || 0
      })
    );

    // Tối (2 option)
    const eveningOptions = pickMultiple(restaurants, backupRestaurants, 2);
    eveningOptions.forEach((opt) =>
      dayPlan.activities.push({
        time: 'Tối',
        ...opt.toObject(),
        cost: opt.avgPrice || 0
      })
    );

    // Ngủ (chọn hotel gần 1 trong các option buổi tối đầu tiên)
    if (eveningOptions.length) {
      const hotel = findNearestHotel(
        hotels.length ? hotels : backupHotels,
        eveningOptions[0]
      );
      if (hotel) {
        dayPlan.activities.push({
          time: 'Ngủ',
          ...hotel.toObject(),
          cost: hotel.avgPrice || 0
        });
      }
    }

    plan.push(dayPlan);
  }

  return plan;
}

async function formatTripPlanWithGPT(tripPlan, numDays, city) {
  const totalCost = tripPlan.reduce((sum, day) => {
    return (
      sum + day.activities.reduce((daySum, act) => daySum + (act.cost || 0), 0)
    );
  }, 0);

  const messages = [
    {
      role: 'system',
      content: `Bạn là trợ lý du lịch thân thiện, hãy trình bày lịch trình gọn gàng bằng markdown, có emoji, dễ đọc, tự nhiên như đang tư vấn.`
    },
    {
      role: 'user',
      content: `
Đây là dữ liệu JSON của lịch trình ${numDays} ngày ở ${city}:\n
${JSON.stringify(tripPlan)}\n
Tổng chi phí ước tính: ${totalCost} VND.\n

Yêu cầu:
- Trình bày lịch trình chia theo ngày (sáng, trưa, chiều, tối, ngủ).
- Mỗi hoạt động nên có tên, địa chỉ, chi phí.
- Cuối cùng hiển thị **Tổng chi phí ước tính: ${totalCost} VND** 💰.
- Viết thân mật, gợi ý thêm chút cảm xúc (ví dụ: “thử đặc sản”, “chụp hình sống ảo”).
- Cuối cùng **cảnh báo rõ**: đây chỉ là chi phí ước tính, thực tế có thể thay đổi do mùa, địa điểm, lựa chọn nhà hàng/khách sạn.`
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
    q.includes('quán ăn') ||
    q.includes('cafe') ||
    q.includes('quán cà phê') ||
    q.includes('điểm vui chơi') ||
    q.includes('điểm tham quan') ||
    q.includes('tourist spot')
  );
}

module.exports = {
  classifyQuestion,
  isWeatherQuestion,
  createTripPlan,
  formatTripPlanWithGPT,
  isPlaceListQuestion
};
