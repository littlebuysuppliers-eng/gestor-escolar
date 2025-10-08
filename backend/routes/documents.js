import express from 'express';
import multer from 'multer';
import { uploadToDrive } from '../googleDrive.js';
import { getDB } from '../models.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload/:userId', upload.single('file'), async (req, res) => {
  const { userId } = req.params;
  try {
    const uploaded = await uploadToDrive(userId, req.file);
    const db = getDB();

    db.run(
      `INSERT INTO documents (user_id, name, drive_id, drive_link)
       VALUES (?, ?, ?, ?)`,
      [userId, uploaded.name, uploaded.id, uploaded.webViewLink],
      function (err) {
        db.close();
        if (err) return res.status(500).json({ error: 'Error al guardar en base de datos' });
        res.json({ message: 'Archivo subido con éxito', link: uploaded.webViewLink });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

export default router;
