const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;

function travelAdvice(condition, temp, humidity) {
  if (
    condition.includes('mưa') ||
    condition.includes('giông') ||
    condition.includes('bão')
  ) {
    return 'Thời tiết không thuận lợi để đi du lịch, bạn nên cân nhắc.';
  }
  if (temp >= 35 || humidity > 85) {
    return 'Trời hơi oi bức, nếu đi du lịch bạn nhớ chuẩn bị nước uống và che nắng.';
  }
  return 'Thời tiết khá đẹp, rất phù hợp để đi du lịch.';
}

async function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&units=metric&appid=${OPENWEATHER_KEY}&lang=vi`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Không lấy được dữ liệu thời tiết');

  const data = await response.json();
  // Trích xuất thông tin quan trọng
  const weatherDesc = data.weather[0].description; // mô tả thời tiết
  const temp = data.main.temp; // nhiệt độ
  const feelsLike = data.main.feels_like; // nhiệt độ cảm nhận
  const humidity = data.main.humidity; // độ ẩm
  const windSpeed = data.wind.speed; // tốc độ gió

  return `Thời tiết tại ${
    data.name
  }: ${weatherDesc}, nhiệt độ ${temp}°C (cảm giác ${feelsLike}°C), độ ẩm ${humidity}%, gió ${windSpeed} m/s.  ${travelAdvice(
    weatherDesc,
    temp,
    humidity
  )}`;
}

module.exports = { getWeather };
