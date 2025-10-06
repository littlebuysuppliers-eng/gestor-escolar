const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { User } = require('../models');
const { generateToken, authMiddleware } = require('../auth');

// Registro
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['teacher', 'director'].includes(role))
    return res.status(400).json({ message: 'Invalid role' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash: hash, role });

  res.json({
    token: generateToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  res.json({
    token: generateToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// Cambio de contraseña (protegida)
router.post('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.user;

  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Old password incorrect' });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: 'Password updated' });
});

module.exports = router;
