const ChatMessage = require('../models/ChatMessage');
const Place = require('../models/Place');
const { chatWithLLM } = require('../services/Chatbot/aiClient');
const { getWeather } = require('../services/Chatbot/weather');
const { extractCity } = require('../services/Chatbot/extractCity');
const {
  classifyQuestion,
  isWeatherQuestion,
  createTripPlan,
  formatTripPlanWithGPT,
  isPlaceListQuestion
} = require('../utils/chatbot');

function isTransportQuestion(question) {
  return /(đi|từ).+(đến).+(bằng|phương tiện|xe|máy bay|tàu)/i.test(question);
}

const ask = async (req, res) => {
  try {
    const { userId, question } = req.body;
    if (!question) return res.status(400).json({ message: 'Missing question' });

    // Lưu câu hỏi user
    await ChatMessage.create({ userId, role: 'user', content: question });

    let answer = '';

    // === 1. Kiểm tra xem user đang trả lời số ngày không ===
    if (/^\d+(\s*ngày)?$/.test(question)) {
      // Tìm message gần nhất của user có awaitingDays = true
      const lastState = await ChatMessage.findOne({
        userId,
        awaitingDays: true
      }).sort({ createdAt: -1 });

      if (lastState) {
        const numDays = parseInt(question.match(/\d+/)[0]);
        const tripPlan = await createTripPlan(lastState.city, numDays);

        answer = tripPlan
          ? await formatTripPlanWithGPT(tripPlan, numDays, lastState.city)
          : `Xin lỗi, hiện tại tôi không có dữ liệu địa điểm ở ${lastState.city}.`;

        // Lưu message mới (không cần awaitingDays nữa)
        await ChatMessage.create({
          userId,
          role: 'assistant',
          content: answer,
          category: 'plan_trip',
          city: lastState.city,
          awaitingDays: false
        });
      }

      return res.json({ answer });
    }
    if (isTransportQuestion(question)) {
      // Lấy lịch sử hội thoại gần đây
      const history = await ChatMessage.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      const messages = [
        {
          role: 'system',
          content:
            'Bạn là trợ lý AI chuyên du lịch, hãy tư vấn phương tiện đi lại giữa các tỉnh thành ở Việt Nam. Hãy gợi ý phương tiện rẻ nhất, nhanh nhất và hợp lý nhất.'
        },
        ...history
          .reverse()
          .filter((h) => h.role && h.content)
          .map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: question }
      ];
      const answer = await chatWithLLM(messages);
      await ChatMessage.create({ userId, role: 'assistant', content: answer });
      return res.json({ answer });
    }
    // === 2. Phân loại câu hỏi mới ===
    const category = await classifyQuestion(question);

    if (category === 'greeting') {
      answer = 'Chào bạn! Tôi có thể giúp bạn về du lịch. 😊';
    } else if (category === 'other') {
      answer = 'Xin lỗi, tôi chỉ có thể hỗ trợ về du lịch.';
    } else if (category === 'travel') {
      const cityToUse = await extractCity(question);

      if (isWeatherQuestion(question)) {
        try {
          answer = await getWeather(cityToUse);
        } catch {
          answer = 'Xin lỗi, tôi không lấy được dữ liệu thời tiết hiện tại.';
        }
      } else if (isPlaceListQuestion(question)) {
        const typeMap = {
          'khách sạn': 'hotel',
          hotel: 'hotel',
          'nhà hàng': 'restaurant',
          'quán ăn': 'restaurant',
          cafe: 'cafe',
          'quán cà phê': 'cafe',
          'điểm vui chơi': 'touristSpot',
          'điểm tham quan': 'touristSpot',
          'điểm du lịch': 'touristSpot',
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
        // fallback AI
        const history = await ChatMessage.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        const messages = [
          {
            role: 'system',
            content:
              'Bạn là trợ lý AI thân thiện chuyên về DU LỊCH, trả lời ngắn gọn, dễ hiểu.'
          },
          ...history
            .reverse()
            .filter((h) => h.role && h.content)
            .map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: question }
        ];

        answer = await chatWithLLM(messages);
      }
      await ChatMessage.create({ userId, role: 'assistant', content: answer });
    } else if (category === 'plan_trip') {
      const city = await extractCity(question);
      const daysMatch = question.match(/(\d+)\s*ngày/);
      const numDays = daysMatch ? parseInt(daysMatch[1]) : null;

      if (!numDays) {
        answer = 'Vui lòng cho biết số ngày bạn muốn lập kế hoạch du lịch.';

        await ChatMessage.create({
          userId,
          role: 'assistant',
          content: answer,
          category,
          city,
          awaitingDays: true
        });
      } else {
        const tripPlan = await createTripPlan(city, numDays);
        answer = tripPlan
          ? await formatTripPlanWithGPT(tripPlan, numDays, city)
          : `Xin lỗi, hiện tại tôi không có dữ liệu địa điểm ở ${city}.`;

        await ChatMessage.create({
          userId,
          role: 'assistant',
          content: answer,
          category,
          city
        });
      }
    }

    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { ask };
