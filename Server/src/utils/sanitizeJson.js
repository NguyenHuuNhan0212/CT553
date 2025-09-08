function sanitizeJsonOutput(text) {
  if (!text) return '{}';

  // Xóa các dấu ```json ... ```
  text = text.replace(/```json|```/g, '').trim();

  // Xóa các ký tự không hợp lệ (ví dụ dấu ba chấm ...)
  text = text.replace(/\.\.\./g, '');

  // Tìm JSON bắt đầu từ { ... } hoặc [ ... ]
  const startCurly = text.indexOf('{');
  const startSquare = text.indexOf('[');

  let start = -1;
  let end = -1;

  if (startCurly !== -1) {
    start = startCurly;
    end = text.lastIndexOf('}');
  } else if (startSquare !== -1) {
    start = startSquare;
    end = text.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }

  // Thử parse để chắc chắn hợp lệ
  try {
    JSON.parse(text);
    return text;
  } catch (err) {
    console.warn('sanitizeJsonOutput: invalid JSON, fallback {}');
    return '{}';
  }
}

module.exports = { sanitizeJsonOutput };
