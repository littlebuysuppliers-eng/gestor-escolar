// backend/routes/users.js
const express = require("express");
const { all } = require("../models");
const router = express.Router();

router.get("/professors", async (req, res) => {
  try {
    const rows = await all(`SELECT id, firstName, lastP, lastM, email, role, grade, groupName, driveFolderId FROM users WHERE role = 'professor' ORDER BY grade, groupName, firstName`);
    res.json({ professors: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener profesores" });
  }
});

module.exports = router;
