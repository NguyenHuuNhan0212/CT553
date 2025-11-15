const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const authRoute = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const placeRoutes = require('./routes/placeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const statsRoutes = require('./routes/statsRoutes');
const MessageModel = require('./models/Message');
const messageRoutes = require('./routes/message');
dotenv.config();

const app = express();

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

connectDB(process.env.MONGO_URI);

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/messages', messageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoute);
app.use('/api', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/stats', statsRoutes);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('sendMessage', async ({ sender, receiver, text }) => {
    const msg = await MessageModel.create({ sender, receiver, text });
    io.to(receiver).emit('receiveMessage', msg);
  });

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
