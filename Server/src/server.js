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
const messageRoutes = require('./routes/messageRoutes');
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

const userRoom = new Map();
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('sendMessage', async ({ sender, receiver, placeId, text }) => {
    const receiverRoom = `${receiver}-${placeId}`;
    const senderRoom = `${sender}-${placeId}`;
    const isReceiverInRoom = [...userRoom.values()].includes(receiverRoom);
    const msg = await MessageModel.create({
      sender,
      receiver,
      placeId,
      text,
      isRead: isReceiverInRoom
    });
    io.to(receiverRoom).emit('receiveMessage', msg);
    if (senderRoom !== receiverRoom) {
      io.to(senderRoom).emit('receiveMessage', msg);
    }
  });

  socket.on('join', async ({ userId, placeId, friendId }) => {
    const room = `${userId}-${placeId}`;
    socket.join(room);

    userRoom.set(socket.id, room);
    await MessageModel.updateMany(
      { sender: friendId, receiver: userId, placeId },
      { isRead: true }
    );
    const friendRoom = `${friendId}-${placeId}`;
    io.to(friendRoom).emit('messagesRead', { placeId });
    console.log('Joined room:', room);
  });

  socket.on('disconnect', () => {
    userRoom.delete(socket.id);
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
