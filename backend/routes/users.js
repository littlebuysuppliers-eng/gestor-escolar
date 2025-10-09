const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authMiddleware } = require('../auth');

// === Obtener todos los usuarios (solo director) ===
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'director') return res.status(403).json({ error: 'Acceso denegado' });
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role'],
    });
    res.json(users);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;
