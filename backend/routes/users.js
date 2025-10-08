import express from 'express';
import { getDB } from '../models.js';

const router = express.Router();

// Obtener usuarios organizados por grado y grupo
router.get('/', (req, res) => {
  const db = getDB();
  db.all(
    `SELECT * FROM users ORDER BY grado ASC, grupo ASC, apellido_paterno ASC`,
    [],
    (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: 'Error al obtener usuarios' });
      res.json(rows);
    }
  );
});

export default router;
