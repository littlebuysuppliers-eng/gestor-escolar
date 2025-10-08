// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { get } = require("../models");
const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_dev";

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token requerido" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Obtener usuario completo (sin password)
    const user = await get(`SELECT id, firstName, lastP, lastM, email, role, grade, groupName, driveFolderId FROM users WHERE id = ?`, [decoded.id]);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });
    req.user = user;
    next();
  } catch (err) {
    console.error("verifyToken err:", err);
    return res.status(401).json({ error: "Token inválido" });
  }
}

module.exports = { verifyToken };
