// backend/routes/documents.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadFileToFolder, renameDriveFile, ensureFolder } = require("../googleDrive");
const { run, all } = require("../models");
const { createDocument, getDocumentsByUser } = require("../models/documents");

const router = express.Router();

// Multer temp folder
const upload = multer({ dest: path.join(__dirname, "../tmp/") });

// Subir archivo: guarda en Drive dentro de la carpeta del usuario (driveFolderId)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const title = req.body.title || file.originalname;
    const user = req.user;

    if (!file) return res.status(400).json({ error: "Archivo no enviado" });

    // Asegurarse de que el usuario tenga driveFolderId. Si no, crearla (por si acaso)
    let folderId = user.driveFolderId;
    if (!folderId) {
      const folderName = `G${user.grade}_G${user.groupName}_U${user.id}_${user.firstName}_${user.lastP}`;
      folderId = await ensureFolder(folderName);
      await run(`UPDATE users SET driveFolderId = ? WHERE id = ?`, [folderId, user.id]);
    }

    // Subir a Drive
    const fullPath = path.join(__dirname, "..", file.path);
    const driveResp = await uploadFileToFolder(fullPath, file.originalname, folderId);

    // Guardar metadata en DB
    await createDocument({
      title,
      driveFileId: driveResp.id,
      driveDownloadLink: driveResp.downloadLink,
      userId: user.id,
      status: "Pendiente",
    });

    res.json({ success: true, file: driveResp });
  } catch (err) {
    console.error("upload err:", err);
    res.status(500).json({ error: "Error al subir archivo" });
  }
});

// Obtener documentos del usuario actual
router.get("/", async (req, res) => {
  try {
    if (req.user.role === "director") {
      // devolver todos los profesores organizados por grado y grupo
      const rows = await all(`SELECT id, firstName, lastP, lastM, email, role, grade, groupName, driveFolderId FROM users WHERE role = 'professor' ORDER BY grade, groupName, firstName`);
      // para cada profesor traer docs
      const professors = [];
      for (const u of rows) {
        const docs = await all(`SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC`, [u.id]);
        professors.push({ ...u, documents: docs });
      }
      // Organizar por grado y grupo en estructura {grade: {groupName: [professors...]}}
      const grouped = {};
      for (const p of professors) {
        const g = p.grade || 0;
        const gp = p.groupName || "A";
        grouped[g] = grouped[g] || {};
        grouped[g][gp] = grouped[g][gp] || [];
        grouped[g][gp].push(p);
      }
      return res.json({ byGrade: grouped });
    } else {
      const docs = await getDocumentsByUser(req.user.id);
      return res.json({ documents: docs });
    }
  } catch (err) {
    console.error("get docs err:", err);
    res.status(500).json({ error: "Error al obtener documentos" });
  }
});

// Renombrar documento (cambia título en DB y opcionalmente nombre en Drive)
router.post("/rename", async (req, res) => {
  try {
    const { documentId, newTitle } = req.body;
    if (!documentId || !newTitle) return res.status(400).json({ error: "Faltan campos" });

    // Buscar documento
    const doc = await all(`SELECT * FROM documents WHERE id = ?`, [documentId]);
    if (!doc || doc.length === 0) return res.status(404).json({ error: "Documento no encontrado" });
    const document = doc[0];

    // Sólo el dueño o director puede renombrar
    if (req.user.role !== "director" && req.user.id !== document.userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // Renombrar en Drive
    await renameDriveFile(document.driveFileId, newTitle);

    // Actualizar DB (title)
    await run(`UPDATE documents SET title = ? WHERE id = ?`, [newTitle, documentId]);

    res.json({ success: true });
  } catch (err) {
    console.error("rename err:", err);
    res.status(500).json({ error: "Error al renombrar documento" });
  }
});

module.exports = router;
