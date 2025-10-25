const { chatWithLLM } = require('../../utils/aiClient');
const Place = require('../../models/Place');
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
4. place_info →  yêu cầu xem thông tin chi tiết của 1 địa điểm (ví dụ: "cho tôi xem thông tin của bến ninh kiều")
5. other → các câu hỏi khác ngoài du lịch
Trả về duy nhất 1 từ: greeting, travel, plan_trip, place_info, other
`
  };
  const userMessage = { role: 'user', content: question };
  const response = await chatWithLLM([systemPrompt, userMessage]);
  const category = response.trim().toLowerCase();
  if (
    ['greeting', 'travel', 'plan_trip', 'place_info', 'other'].includes(
      category
    )
  )
    return category;
  return 'other';
}

// Lấy tên địa điểm

async function extractPlaceName(message) {
  const prompt = `
Bạn là một bộ trích xuất thông tin.
Nhiệm vụ của bạn là tìm **tên địa điểm du lịch, khu nghỉ dưỡng, nhà hàng, quán ăn, khách sạn hoặc địa danh** trong câu sau.
Chỉ trả về JSON ở dạng sau, không giải thích thêm:
{"place": "<tên địa điểm (NẾU CÓ TỪ QUÁN Ở ĐẦU THÌ LOẠI BỎ TỪ QUÁN) hoặc null nếu không có>"}

Câu: "${message}"
`;

  try {
    const responseText = await chatWithLLM([
      {
        role: 'system',
        content: 'Bạn là trợ lý AI chuyên trích xuất tên địa điểm.'
      },
      { role: 'user', content: prompt }
    ]);

    const json = JSON.parse(responseText.trim());
    return json.place || null;
  } catch (error) {
    console.error('Lỗi khi trích xuất địa điểm:', error.message);
    return null;
  }
}

module.exports = { extractPlaceName };

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
    address: { $regex: city, $options: 'i' },
    isActive: true,
    deleted: false,
    isApprove: true
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
        placeId: p._id,
        name: p.name,
        address: p.address,
        cost: getAvgCost(p),
        image: p.images[0],
        services: p.services,
        type: p.type
      })
    );

    // Gợi ý khách sạn (mỗi ngày 1 cái)
    const hotel = hotels.pop() || backupHotels.pop();
    if (hotel) {
      dayPlan.activities.push({
        placeId: hotel._id,
        name: hotel.name,
        address: hotel.address,
        cost: getAvgCost(hotel),
        image: hotel.images[0],
        services: hotel.services,
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
Bạn là **Trợ lý Du lịch AI**, hãy tạo lịch trình du lịch chi tiết và trình bày đẹp mắt.
YÊU CẦU RẤT QUAN TRỌNG:
- LUÔN LUÔN trả về kết quả ở dạng **HTML hoàn chỉnh**, có thể hiển thị trực tiếp trên giao diện web.
- Sử dụng **emoji du lịch** (🍽️☕🏯🏨🌿🏖️🚤...) và định dạng đẹp như trong bài viết du lịch.
- Dùng cấu trúc <h2>, <h3>, <ul>, <li> để phân chia rõ ràng.
- **Không chia sáng/trưa/chiều/tối**, chỉ chia theo **Ngày 1, Ngày 2, ...**.
- Cuối cùng thêm dòng ghi chú: *Chi phí chỉ mang tính ước lượng, có thể thay đổi tùy mùa và lựa chọn thực tế.*
- Nếu có địa điểm có type là "hotel" → ghi rõ: “🏨 Gợi ý nghỉ đêm tại ...”.
- Nếu có type là "cafe" → ghi rõ: “☕ ... (Chi phí phụ thuộc vào đồ uống bạn dùng)”.
- Nếu không có giá → hiển thị “(Miễn phí)”.
- Không cần hiển thị hình ảnh.
- Trình bày **ngắn gọn, tự nhiên như đang gợi ý cho khách du lịch**, có tiêu đề rõ ràng ví dụ “Lịch trình 3 ngày ở Cần Thơ”.
- Tuyệt đối KHÔNG trả về Markdown hay JSON — chỉ trả về HTML.
`
    },
    {
      role: 'user',
      content: `
Dưới đây là dữ liệu JSON của lịch trình ${numDays} ngày ở ${city}:
${JSON.stringify(tripPlan, null, 2)}

Hãy tạo lịch trình theo các yêu cầu trên và trình bày thật đẹp mắt, sinh động, có đầu đề, emoji, chi phí, và phần ghi chú ở cuối.
`
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

async function getPlaceInfo(placeName, address) {
  let place;
  if (!address) {
    place = await Place.findOne({
      name: { $regex: placeName, $options: 'i' },
      isActive: true,
      deleted: false,
      isApprove: true
    }).lean();
  } else {
    place = await Place.findOne({
      name: { $regex: placeName, $options: 'i' },
      address: { $regex: address, $options: 'i' },
      isActive: true,
      deleted: false,
      isApprove: true
    }).lean();
  }
  return place ? place : null;
}
async function formatPlaceInfoWithGPT(place) {
  if (!place) return 'Không có thông tin địa điểm.';

  const prompt = `
Bạn là trợ lý AI chuyên viết mô tả du lịch ngắn gọn, thân thiện, và trả về KHOẢNG HTML hoàn chỉnh (a fragment) để hiển thị trực tiếp trên web.
**QUY TẮC RẤT QUAN TRỌNG — CHỈ TRẢ VỀ HTML:**
1. Chỉ trả về HTML (KHÔNG có lời giải thích, không có JSON, không có text ngoài HTML).  
2. HTML phải bao gồm thẻ <h2> cho tiêu đề, <h3> cho phần phụ (ví dụ: Địa chỉ), và <ul>/<li> để liệt kê dịch vụ.  
3. Sử dụng emoji du lịch thích hợp (ví dụ: 🌿, 🍽️, 🏖️, 🚤, 🏨) trong tiêu đề và danh sách.  
4. Loại bỏ bất kỳ tag HTML thô trong field description (nếu description chứa HTML, hãy chuyển nó thành text plain, giữ các đoạn ngắt dòng).  
5. Không thêm thông tin mới ngoài dữ liệu trong "Dữ liệu JSON" dưới đây. Nếu thiếu thông tin (vd: tỉnh), bỏ phần đó hoặc để trống.  
6. Sử dụng ngôn ngữ: tiếng Việt tự nhiên, ngắn gọn, thân thiện, độ dài ~6-12 câu + 1 list dịch vụ.

**Định dạng HTML mong muốn (ví dụ mẫu, trả về tuyệt đối giống cấu trúc này):**
<section class="place-card">
  <h2>🌿 Tên địa điểm (Tỉnh/Thành phố)</h2>
  <h3>📍 Địa chỉ</h3>
  <p>...mô tả ngắn gọn, loại bỏ HTML, tối đa 2-3 câu...</p>
  <h3>🛎️ Dịch vụ & Giá</h3>
  <ul>
    <li>Vé vào cổng (Người lớn): 70.000 đ</li>
    <li>Vé vào cổng (Trẻ em): 30.000 đ</li>
    ...
  </ul>
</section>

**Bắt buộc:** trả về **CHỈ** đoạn HTML fragment như ví dụ trên — không thêm bất kỳ chú thích hoặc dấu ngoặc code nào.

Dữ liệu JSON:
${JSON.stringify(place, null, 2)}
`;

  try {
    const response = await chatWithLLM([
      {
        role: 'system',
        content:
          'Bạn là chuyên gia viết mô tả du lịch ngắn gọn, sinh động và chuẩn tiếng Việt.'
      },
      { role: 'user', content: prompt }
    ]);

    return response.trim();
  } catch (error) {
    console.error('❌ Lỗi khi format địa điểm:', error.message);
    return 'Không thể định dạng thông tin địa điểm.';
  }
}

module.exports = {
  classifyQuestion,
  isWeatherQuestion,
  createTripPlan,
  formatTripPlanWithGPT,
  isPlaceListQuestion,
  getAvgCost,
  extractPlaceName,
  getPlaceInfo,
  formatPlaceInfoWithGPT
};
