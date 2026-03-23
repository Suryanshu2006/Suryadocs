const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const initializeSocket = require('./socket');
const authRoutes = require('./routes/auth').route;
const documentRoutes = require('./routes/documents');
const Document = require('./models/Document');
const { requireAuth } = require('./routes/auth');

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Additional route for saving the document binary content directly
app.put('/api/documents/:id/save', requireAuth, async (req, res) => {
  try {
    const { content } = req.body; // Expecting an array of bytes
    const buffer = Buffer.from(content);
    
    await Document.findByIdAndUpdate(req.params.id, { content: buffer });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save document' });
  }
});

initializeSocket(server);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-editor')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
