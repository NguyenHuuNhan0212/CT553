const multer = require('multer');
const path = require('path');

// Nơi lưu file tạm thời (public/uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // 📂 ảnh sẽ được lưu trong /public/uploads
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + '-' + file.originalname // tránh trùng tên
    );
  }
});

// Lọc chỉ cho phép file ảnh
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép file ảnh!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

module.exports = upload;
