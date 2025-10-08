import express from 'express';
import { getDB } from '../models.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Registro
router.post('/register', (req, res) => {
  const { nombres, apellido_paterno, apellido_materno, grado, grupo, email, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  const db = getDB();

  db.run(
    `INSERT INTO users (nombres, apellido_paterno, apellido_materno, grado, grupo, email, password)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nombres, apellido_paterno, apellido_materno, grado, grupo, email, hashed],
    function (err) {
      db.close();
      if (err) return res.status(400).json({ error: 'El correo ya está registrado' });
      res.json({ message: 'Usuario registrado exitosamente' });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDB();
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Usuario no encontrado' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Contraseña incorrecta' });
    res.json({ message: 'Login exitoso', user });
  });
  db.close();
});

export default router;
