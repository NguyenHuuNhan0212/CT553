import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// hàm gửi mail
export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"VIGO TRAVEL" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('✅ Mail đã gửi:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Lỗi gửi mail:', error);
    throw error;
  }
};
