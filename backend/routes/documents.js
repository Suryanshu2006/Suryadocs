const express = require('express');
const Document = require('../models/Document');
const { requireAuth } = require('./auth');

const router = express.Router();

// Get all documents for a user
router.get('/', requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [
        { owner: req.user.userId },
        { 'collaborators.user': req.user.userId }
      ]
    }).select('-content').sort({ updatedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new document
router.post('/', requireAuth, async (req, res) => {
  try {
    const doc = new Document({
      title: req.body.title || 'Untitled Document',
      owner: req.user.userId,
      collaborators: []
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a document
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    if (!doc) return res.status(404).json({ message: 'Document not found or unauthorized' });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific document
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    
    // Convert Buffer to binary string array if content exists, so JSON can send it
    const docData = doc.toObject();
    if (docData.content && docData.content.buffer) {
      docData.content = Array.from(new Uint8Array(docData.content.buffer));
    } else if (docData.content) {
      docData.content = Array.from(new Uint8Array(docData.content));
    }
    
    res.json(docData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
