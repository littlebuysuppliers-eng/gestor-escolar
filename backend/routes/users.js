const express = require('express');
const router = express.Router();
const { User } = require('../models');

// simple list of professors (used by frontend)
router.get('/professors', async (req, res) => {
  try {
    const rows = await User.findAll({ where: { role: 'teacher' }, order: [['grade','ASC'], ['groupName','ASC'], ['firstName','ASC']] });
    res.json({ professors: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener profesores' });
  }
});

module.exports = router;
