// controllers/chatController.js
const Place = require('../models/Place');
const { chatWithLLM } = require('../services/Chatbot/aiClient');
const { getWeather } = require('../services/Chatbot/weather');
const { extractCity } = require('../services/Chatbot/extractCity');
const { getSession, setSession, clearSession } = require('../utils/session');
const {
  classifyQuestion,
  isWeatherQuestion,
  createTripPlan,
  formatTripPlanWithGPT,
  isPlaceListQuestion
} = require('../utils/chatbot');

const ask = async (req, res) => {
  try {
    const { userId, question } = req.body;
    if (!question) return res.status(400).json({ message: 'Missing question' });

    const session = getSession(userId);
    console.log('Current session:', session);
    let answer = '';

    // Nếu đang chờ số ngày từ user
    if (session.awaitingDays && /^\d+(\s*ngày)?$/.test(question)) {
      const numDays = parseInt(question.match(/\d+/)[0]);
      const tripPlan = await createTripPlan(session.city, numDays);
      if (!tripPlan) {
        answer = `Xin lỗi, hiện tại tôi không có dữ liệu địa điểm ở ${session.city}.`;
      } else {
        answer = await formatTripPlanWithGPT(tripPlan, numDays, session.city);
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
        } // Nếu hỏi danh sách place (khách sạn, quán cafe, …)
        else if (isPlaceListQuestion(question)) {
          const typeMap = {
            'khách sạn': 'hotel',
            hotel: 'hotel',
            'nhà hàng': 'restaurant',
            'quán ăn': 'restaurant',
            cafe: 'cafe',
            'quán cà phê': 'cafe',
            'điểm vui chơi': 'touristSpot',
            'điểm tham quan': 'touristSpot',
            'tourist spot': 'touristSpot'
          };

          let foundType = null;
          for (const key of Object.keys(typeMap)) {
            if (question.toLowerCase().includes(key)) {
              foundType = typeMap[key];
              break;
            }
          }

          const places = await Place.find({
            address: { $regex: cityToUse, $options: 'i' },
            type: foundType
          });

          if (!places.length) {
            answer = `Xin lỗi, tôi chưa có dữ liệu về ${
              foundType || 'địa điểm'
            } ở ${cityToUse}.`;
          } else {
            answer =
              `Một số ${foundType} nổi bật tại ${cityToUse}:\n` +
              places
                .map(
                  (p, i) =>
                    `${i + 1}. ${p.name} - ${p.address} - ${
                      p.description
                    } - Giá trung bình: ${p.avgPrice || 'N/A'} VND${
                      foundType === 'hotel'
                        ? '/đêm'
                        : foundType === 'restaurant'
                        ? '/người'
                        : foundType === 'cafe'
                        ? '/ly'
                        : foundType === 'touristSpot'
                        ? '/vé'
                        : ''
                    }`
                )
                .join('\n\n');
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
            answer = await formatTripPlanWithGPT(tripPlan, numDays, city);
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
