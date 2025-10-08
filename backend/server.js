// server.js (en la raíz GestorEscolar/)
require("dotenv").config();
const express = require("express");
const path = require("path");
const { init } = require("./backend/models");
const authRoutes = require("./backend/auth");
const docsRoutes = require("./backend/routes/documents");
const usersRoutes = require("./backend/routes/users");
const { verifyToken } = require("./backend/middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas públicas
app.use("/api/auth", authRoutes);

// Rutas que requieren auth
app.use("/api/documents", verifyToken, docsRoutes);
app.use("/api/users", verifyToken, usersRoutes);

// Servir frontend estático
app.use(express.static(path.join(__dirname, "frontend")));

init().then(() => {
  app.listen(PORT, () => console.log(`✅ Server en http://localhost:${PORT}`));
});
