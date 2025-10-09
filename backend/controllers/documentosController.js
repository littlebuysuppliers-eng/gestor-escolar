const { uploadFile } = require('../config/googleDrive');
const path = require('path');
const fs = require('fs');
const { Documento } = require('../models');

exports.subirDocumento = async (req, res) => {
  try {
    const filePath = path.join(__dirname, `../../uploads/${req.file.filename}`);
    const file = await uploadFile(filePath, req.file.originalname, req.file.mimetype);

    // Guarda el registro en la base de datos
    await Documento.create({
      nombre: req.file.originalname,
      driveId: file.id,
      driveLink: file.webViewLink,
      usuarioId: req.user.id,
    });

    // Borra el archivo local después de subirlo a Drive
    fs.unlinkSync(filePath);

    res.json({ success: true, link: file.webViewLink });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir el archivo a Google Drive' });
  }
};
