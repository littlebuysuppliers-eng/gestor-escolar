// backend/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { run, get } = require("./models");
const { ensureFolder } = require("./googleDrive");

const router = express.Router();

// Variables: asegúrate de definir JWT_SECRET en .env
const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_dev";

// Registro con campos: firstName, lastP, lastM, email, password, grade, groupName
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastP, lastM, email, password, grade, groupName } = req.body;
    if (!firstName || !lastP || !email || !password || !grade || !groupName) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Guardar usuario (sin folder aún)
    const insert = await run(
      `INSERT INTO users (firstName, lastP, lastM, email, password, grade, groupName, role) VALUES (?,?,?,?,?,?,?,?)`,
      [firstName, lastP, lastM || "", email, hashed, grade, groupName, "professor"]
    );

    const userId = insert.lastID;

    // Crear carpeta en Drive para este usuario. Nombre: grade_group_userId_first_last
    const folderName = `G${grade}_G${groupName}_U${userId}_${firstName}_${lastP}`;
    const folderId = await ensureFolder(folderName);

    // Actualizar usuario con driveFolderId
    await run(`UPDATE users SET driveFolderId = ? WHERE id = ?`, [folderId, userId]);

    res.json({ success: true, userId });
  } catch (err) {
    console.error(err);
    if (err && err.message && err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }
    res.status(500).json({ error: "Error en registro" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      grade: user.grade,
      groupName: user.groupName
    }, JWT_SECRET, { expiresIn: "12h" });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastP: user.lastP,
        lastM: user.lastM,
        email: user.email,
        role: user.role,
        grade: user.grade,
        groupName: user.groupName
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en login" });
  }
});

module.exports = router;
