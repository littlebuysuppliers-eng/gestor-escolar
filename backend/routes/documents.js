const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Document, Comment, User } = require('../models');
const { authMiddleware, roleRequired } = require('../auth');

const router = express.Router();

// Carpeta de uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ====== Subir documento (solo profesores) ======
router.post('/upload', authMiddleware, roleRequired(['teacher']), upload.single('file'), async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;
    const { title } = req.body;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const doc = await Document.create({
      title: title || file.originalname,
      filename: file.originalname,
      filepath: file.filename,
      userId: user.id
    });

    res.json({ success: true, document: doc });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// ====== Listar documentos ======
router.get('/', authMiddleware, async (req, res) => {
  const user = req.user;
  try {
    if (user.role === 'teacher') {
      const docs = await Document.findAll({ where: { userId: user.id }, include: [Comment] });
      return res.json({ documents: docs });
    } else if (user.role === 'director') {
      const professors = await User.findAll({
        where: { role: 'teacher' },
        include: [{ model: Document, include: [Comment] }]
      });
      return res.json({ professors });
    }
  } catch (err) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// ====== Descargar documento ======
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'teacher' && req.user.id !== doc.userId)
      return res.status(403).json({ message: 'Forbidden' });

    res.download(path.join(uploadDir, doc.filepath), doc.filename);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Error downloading file' });
  }
});

// ====== Comentar documento (solo directores) ======
router.post('/:id/comment', authMiddleware, roleRequired(['director']), async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const { text, status } = req.body;
    const comment = await Comment.create({ text, documentId: doc.id, userId: req.user.id });

    if (status) {
      doc.status = status;
      await doc.save();
    }

    res.json({ comment, document: doc });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Error commenting document' });
  }
});

module.exports = router;
