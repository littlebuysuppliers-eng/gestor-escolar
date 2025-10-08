import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initDB } from './backend/models.js';
import authRoutes from './backend/routes/auth.js';
import documentRoutes from './backend/routes/documents.js';
import userRoutes from './backend/routes/users.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas del backend
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

// Inicializa la base de datos
initDB();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));
