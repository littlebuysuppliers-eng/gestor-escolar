const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadFileToDrive } = require("../googleDrive");
const { Document, User } = require("../models");

const router = express.Router();

// Configuración temporal para guardar archivos antes de subirlos a Drive
const upload = multer({ dest: "tmp/" });

// 📤 Subir archivo y guardar enlace en la base de datos
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../../", req.file.path);
    const fileName = req.file.originalname;
    const userId = req.user.id;

    // Subir a Drive
    const driveResponse = await uploadFileToDrive(filePath, fileName);

    // Guardar en base de datos
    const document = await Document.create({
      title: fileName,
      filepath: driveResponse.downloadLink,
      userId: userId,
      status: "Pendiente",
    });

    res.json({
      message: "✅ Archivo subido correctamente a Google Drive",
      document,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al subir el archivo" });
  }
});

// 📄 Obtener documentos del usuario actual
router.get("/", async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Document }],
    });

    if (user.role === "director") {
      // Mostrar todos los profesores con sus documentos
      const professors = await User.findAll({
        where: { role: "professor" },
        include: [{ model: Document }],
      });
      return res.json({ professors });
    } else {
      return res.json({ documents: user.Documents });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener documentos" });
  }
});

module.exports = router;
