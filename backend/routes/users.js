const express = require('express');
const router = express.Router();
const { User } = require('../models');

// list professors by name
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({ where: { role: 'teacher' }, order: [['firstName','ASC'], ['lastP','ASC']] });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;
