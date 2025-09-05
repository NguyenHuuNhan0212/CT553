// controllers/chatController.js
const Place = require('../models/Place');
const { chatWithLLM } = require('../services/Chatbot/aiClient');
const { getWeather } = require('../services/Chatbot/weather');
const { extractCity } = require('../services/Chatbot/extractCity');
const { getSession, setSession, clearSession } = require('../utils/session');
const { set } = require('mongoose');
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

// Tạo lịch trình từ Place
async function createTripPlan(city, numDays = 1) {
  // Lấy tất cả các place ở city
  const places = await Place.find({ address: { $regex: city, $options: 'i' } });

  if (!places.length) return null;

  // Chia lịch trình theo ngày
  const plan = [];
  const activitiesPerDay = Math.ceil(places.length / numDays);

  for (let day = 1; day <= numDays; day++) {
    const start = (day - 1) * activitiesPerDay;
    const end = start + activitiesPerDay;
    const dayPlaces = places.slice(start, end);

    const dayPlan = {
      day,
      activities: dayPlaces.map((p) => ({
        name: p.name,
        type: p.type,
        address: p.address,
        description: p.description,
        cost: p.avgPrice || 0
      }))
    };

    plan.push(dayPlan);
  }

  return plan;
}
function formatTripPlan(tripPlan, numDays, city) {
  let totalCost = 0;
  let planText = `Lịch trình ${numDays} ngày ở ${city}:\n\n`;
  tripPlan.forEach((day) => {
    planText += `Ngày ${day.day}:\n`;
    day.activities.forEach((act, idx) => {
      planText += `${idx + 1}. ${act.name} (${act.type}) - ${
        act.address
      } - chi phí: ${act.cost} VND\n`;
      totalCost += act.cost;
    });
    planText += '\n';
  });
  planText += `Tổng chi phí ước tính: ${totalCost} VND`;
  return planText;
}

const ask = async (req, res) => {
  try {
    const { userId, question } = req.body;
    if (!question) return res.status(400).json({ message: 'Missing question' });

    const session = getSession(userId);
    console.log('Current session:', session);
    let answer = '';

    // Nếu đang chờ số ngày từ user
    if (session.awaitingDays && /^\d+\s*ngày?$/.test(question)) {
      const numDays = parseInt(question.match(/\d+/)[0]);
      const tripPlan = await createTripPlan(session.city, numDays);
      if (!tripPlan) {
        answer = `Xin lỗi, hiện tại tôi không có dữ liệu địa điểm ở ${session.city}.`;
      } else {
        answer = formatTripPlan(tripPlan, numDays, session.city);
      }
      clearSession(userId);
    } else {
      const category = await classifyQuestion(question);
      console.log('Classified category:', category);

      if (category === 'greeting') {
        answer = 'Chào bạn! Tôi có thể giúp bạn về du lịch. 😊';
      } else if (category === 'other') {
        answer = 'Xin lỗi, tôi chỉ có thể hỗ trợ về du lịch.';
      } else if (category === 'travel') {
        const cityToUse = session.city || (await extractCity(question));
        setSession(userId, { city: cityToUse });

        if (isWeatherQuestion(question)) {
          try {
            answer = await getWeather(cityToUse);
          } catch {
            answer = 'Xin lỗi, tôi không lấy được dữ liệu thời tiết hiện tại.';
          }
        } else {
          // Gửi prompt cho AI, kèm city nếu có
          const messages = [
            {
              role: 'system',
              content:
                'Bạn là trợ lý AI thân thiện chuyên về DU LỊCH, trả lời ngắn gọn, dễ hiểu.'
            },
            {
              role: 'user',
              content: cityToUse
                ? `Câu hỏi: ${question}. Thành phố liên quan: ${cityToUse}`
                : `Câu hỏi: ${question}`
            }
          ];
          answer = await chatWithLLM(messages);
        }
      } else if (category === 'plan_trip') {
        const city = await extractCity(question);
        const daysMatch = question.match(/(\d+)\s*ngày/);
        const numDays = daysMatch ? parseInt(daysMatch[1]) : null;

        if (!numDays) {
          answer = 'Vui lòng cho biết số ngày bạn muốn lập kế hoạch du lịch.';
          setSession(userId, { city, awaitingDays: true });
        } else {
          const tripPlan = await createTripPlan(city, numDays);
          if (!tripPlan) {
            answer = `Xin lỗi, hiện tại tôi không có dữ liệu địa điểm ở ${city}.`;
          } else {
            answer = formatTripPlan(tripPlan, numDays, city);
          }
        }
      }
    }

    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { ask };
