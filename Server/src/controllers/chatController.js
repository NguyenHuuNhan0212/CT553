const ChatMessage = require('../models/ChatMessage');
const Place = require('../models/Place');
const { chatWithLLM } = require('../utils/aiClient');
const { getWeather } = require('../services/Chatbot/weather');
const { extractCity } = require('../services/Chatbot/extractCity');
const {
  classifyQuestion,
  isWeatherQuestion,
  createTripPlan,
  formatTripPlanWithGPT,
  isPlaceListQuestion,
  getAvgCost,
  extractPlaceName,
  getPlaceInfo,
  formatPlaceInfoWithGPT
} = require('../services/Chatbot/chatbot');

function isTransportQuestion(question) {
  return /(đi|từ).+(đến).+(bằng|phương tiện|xe|máy bay|tàu)/i.test(question);
}

const ask = async (req, res) => {
  try {
    const { userId } = req.user;
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Missing question' });

    // Lưu câu hỏi user
    await ChatMessage.create({ userId, role: 'user', content: question });

    let answer = '';
    let tripPlan = null;
    let cityToUse = null;
    // === 1. Kiểm tra xem user đang trả lời số ngày không ===
    if (/^\d+(\s*ngày)?$/.test(question)) {
      // Tìm message gần nhất của user có awaitingDays = true
      const lastState = await ChatMessage.findOne({
        userId,
        awaitingDays: true
      }).sort({ createdAt: -1 });

      if (lastState) {
        const numDays = parseInt(question.match(/\d+/)[0]);
        tripPlan = await createTripPlan(lastState.city, numDays);

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

      return res.json({
        answer,
        tripPlan,
        city: lastState.city,
        isTripPlan: tripPlan ? true : false
      });
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
          content: `Bạn là trợ lý AI chuyên du lịch, hãy tư vấn phương tiện đi lại giữa các tỉnh thành ở Việt Nam.
              Hãy gợi ý phương tiện rẻ nhất, nhanh nhất và hợp lý nhất. TRẢ LỜI VỀ DƯỚI DẠNG HTML`
        },

        ...history
          .reverse()
          .filter((h) => h.role && h.content)
          .map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: question }
      ];
      const answer = await chatWithLLM(messages);
      await ChatMessage.create({ userId, role: 'assistant', content: answer });
      return res.json({
        answer
      });
    }
    // === 2. Phân loại câu hỏi mới ===
    const category = await classifyQuestion(question);
    if (category === 'place_info') {
      const placeName = await extractPlaceName(question);
      const city = await extractCity(question);
      const place = await getPlaceInfo(placeName, city);
      const formatPlaceInfo = await formatPlaceInfoWithGPT(place);
      answer = `${formatPlaceInfo}`;
    } else if (category === 'greeting') {
      answer = 'Chào bạn! Tôi có thể giúp bạn về du lịch. 😊';
    } else if (category === 'other') {
      answer = 'Xin lỗi, tôi chỉ có thể hỗ trợ về du lịch.';
    } else if (category === 'travel') {
      cityToUse = await extractCity(question);

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
          'địa điểm ăn uống': 'restaurant',
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
        })
          .lean()
          .sort({ bookingCount: -1 })
          .limit(5);
        const placesWithAvg = places.map((p) => {
          return {
            ...p,
            avgPrice: getAvgCost(p)
          };
        });
        if (!placesWithAvg.length) {
          answer = `Xin lỗi, tôi chưa có dữ liệu về ${
            foundType || 'địa điểm'
          } ở ${cityToUse}.`;
        } else {
          const placeType =
            foundType === 'touristSpot'
              ? 'Địa điểm du lịch'
              : foundType === 'cafe'
              ? 'Quán cafe'
              : foundType === 'hotel'
              ? 'Địa điểm lưu trú'
              : 'Địa điểm ăn uống';
          answer =
            `Một số ${placeType} nổi bật tại ${cityToUse}:\n` +
            placesWithAvg
              .map(
                (p, i) =>
                  `<p>${i + 1}. ${p.name} - ${p.address}</p>
                    <a href="http://localhost:5173/place/${
                      p._id
                    }" target="_blank" style="color:#1677ff;text-decoration:none;">
  🔗 Xem chi tiết
</a>
                 ${p.description} - Giá trung bình: ${
                    p.avgPrice || 'Không có thông tin về giá các dịch vụ'
                  } ${
                    p.avgPrice
                      ? foundType === 'hotel'
                        ? 'VND/đêm'
                        : foundType === 'restaurant'
                        ? 'VND/người'
                        : foundType === 'cafe'
                        ? 'VND/dịch vụ'
                        : foundType === 'touristSpot'
                        ? 'VND/dịch vụ'
                        : ''
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
      await ChatMessage.create({
        userId,
        role: 'assistant',
        content: answer,
        city: cityToUse
      });
    } else if (category === 'plan_trip') {
      cityToUse = await extractCity(question);

      // Nếu không có city trong câu hỏi, lấy từ message gần nhất
      if (cityToUse === 'NULL') {
        const lastCityMsg = await ChatMessage.findOne({
          userId,
          city: { $exists: true, $ne: 'NULL' }
        }).sort({ createdAt: -1 });
        if (lastCityMsg) cityToUse = lastCityMsg.city;
      }

      const daysMatch = question.match(/(\d+)\s*ngày/);
      const numDays = daysMatch ? parseInt(daysMatch[1]) : null;

      if (!numDays) {
        answer =
          'Vui lòng cho biết số ngày bạn muốn lập kế hoạch du lịch. Để tôi có thể hỗ trợ bạn tạo kế hoạch.';

        await ChatMessage.create({
          userId,
          role: 'assistant',
          content: answer,
          category,
          city: cityToUse,
          awaitingDays: true
        });
      } else {
        tripPlan = await createTripPlan(cityToUse, numDays);
        answer = tripPlan
          ? await formatTripPlanWithGPT(tripPlan, numDays, cityToUse)
          : `Xin lỗi, hiện tại tôi không có dữ liệu địa điểm ở ${cityToUse}.`;

        await ChatMessage.create({
          userId,
          role: 'assistant',
          content: answer,
          category,
          city: cityToUse
        });
      }
    }

    res.json({
      answer,
      tripPlan,
      city: cityToUse || '',
      isTripPlan: tripPlan ? true : false
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { ask };
