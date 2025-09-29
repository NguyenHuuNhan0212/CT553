const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const authRoute = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tripPlanRoutes = require('./routes/tripPlanRoutes');
const placeRoutes = require('./routes/placeRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB(process.env.MONGO_URI);

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoute);
app.use('/api/trip-plans', tripPlanRoutes);
app.use('/api', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/hotels', hotelRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
