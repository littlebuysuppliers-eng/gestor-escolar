import express from 'express';
import bcrypt from 'bcryptjs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'clave_super_secreta';

async function openDB() {
  return open({ filename: './backend/database.sqlite', driver: sqlite3.Database });
}

// Registro
router.post('/register', async (req, res) => {
  try {
    const { nombres, ap_paterno, ap_materno, grado, grupo, email, password } = req.body;
    if (!nombres || !ap_paterno || !grado || !email || !password)
      return res.status(400).json({ message: 'Faltan datos obligatorios' });

    const db = await openDB();
    const existing = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ message: 'Usuario ya existe' });

    const hashed = await bcrypt.hash(password, 10);

    // Todos los usuarios se crean con rol 'profesor'
    await db.run(
      `INSERT INTO users (nombres, ap_paterno, ap_materno, grado, grupo, email, password, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombres, ap_paterno, ap_materno || '', grado, grupo || '', email, hashed, 'profesor']
    );

    res.json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Faltan datos' });

    const db = await openDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET_KEY, { expiresIn: '6h' });
    res.json({ token, rol: user.rol, nombres: user.nombres, grado: user.grado, grupo: user.grupo });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

export default router;
