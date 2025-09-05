const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const authRoute = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Nếu connectDB trả về Promise, dùng then/catch vì CommonJS không hỗ trợ await ở top-level
connectDB(process.env.MONGO_URI);

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoute);
app.use('/api', userRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
