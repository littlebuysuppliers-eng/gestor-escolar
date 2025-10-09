const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createFolder, uploadFile } = require('../googleDrive');
const { User, Document } = require('../models');

const upload = multer({ dest: path.join(__dirname, '..', 'tmp') });

// Middleware simple to mock auth (in production use JWT verify)
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Upload file to user's Drive folder
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Archivo requerido' });

    // ensure user folder
    let folderId = req.user.driveFolderId;
    if (!folderId) {
      const folderName = `G${req.user.grade}_G${req.user.groupName}_U${req.user.id}_${req.user.firstName}_${req.user.lastP}`;
      folderId = await createFolder(folderName);
      req.user.driveFolderId = folderId;
      await req.user.save();
    }

    const filePath = path.join(__dirname, '..', file.path);
    const buffer = fs.readFileSync(filePath);
    const driveRes = await uploadFile(file.originalname, folderId, buffer);

    // save document record
    const doc = await Document.create({
      title: file.originalname,
      driveFileId: driveRes.id,
      driveDownloadLink: driveRes.downloadLink,
      userId: req.user.id
    });

    // remove temp
    fs.unlinkSync(filePath);

    res.json({ success: true, document: doc });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Error al subir' });
  }
});

// Get documents for a user (director can get all organized)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'director') {
      const teachers = await User.findAll({ where: { role: 'teacher' }, include: [{ model: Document, as: 'documents' }] });
      // organize by grade/group
      const grouped = {};
      teachers.forEach(t => {
        const g = t.grade || 0;
        const gp = t.groupName || 'A';
        grouped[g] = grouped[g] || {};
        grouped[g][gp] = grouped[g][gp] || [];
        grouped[g][gp].push(t);
      });
      return res.json({ byGrade: grouped });
    } else {
      const docs = await req.user.getDocuments({ order: [['createdAt', 'DESC']] });
      return res.json({ documents: docs });
    }
  } catch (err) {
    console.error('Get docs error:', err);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

module.exports = router;
