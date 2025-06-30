require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Schema
const messageSchema = new mongoose.Schema({
    name: String,
    message: String,
    attendance: {
      type: String,
      enum: ['Hadir', 'Tidak Hadir', 'Insyaallah', 'Ragu', ''],
      default: ''
    },
    coupleId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Message = mongoose.model('Message', messageSchema, 'allTheme1');

// POST /messages – simpan pesan
app.post('/messages', async (req, res) => {
    const { name, message, coupleId, attendance } = req.body;

    if (!coupleId || !name || !message) {
        return res.status(400).json({ error: 'coupleId, name, and message are required.' });
    }

    const newMessage = new Message({ name, message, coupleId, attendance });

    try {
        await newMessage.save();
        res.json({ status: 'Message saved successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save message.' });
    }
});

// GET /messages – ambil data berdasarkan coupleId dan theme
app.get('/messages', async (req, res) => {
    const { coupleId, theme } = req.query;

    if (!coupleId) {
        return res.status(400).json({ error: 'coupleId is required as query parameter.' });
    }

    try {
        const messages = await Message.find({ coupleId }).sort({ createdAt: -1 });

        if (theme === '2' || theme === '3') {
            // Hitung jumlah attendance
        const hadir = messages.filter(msg => msg.attendance === 'Hadir').length;
        const tidakHadir = messages.filter(msg => msg.attendance === 'Tidak Hadir').length;
        const insyaallah = messages.filter(msg => msg.attendance === 'Insyaallah').length;
        const ragu = messages.filter(msg => msg.attendance === 'Ragu').length;


        res.json({
          hadir,
          tidakHadir,
          insyaallah,
          ragu,
          messages: messages.map(msg => ({
            name: msg.name,
            message: msg.message,
            attendance: msg.attendance,
            createdAt: msg.createdAt
          }))
        });

        } else {
            // Tampilkan attendance & waktu
            res.json(
                messages.map(msg => ({
                    name: msg.name,
                    message: msg.message,
                    attendance: msg.attendance,
                    createdAt: msg.createdAt
                }))
            );
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});


// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
