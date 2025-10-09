import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './backend/routes/auth.js';
import documentsRoutes from './backend/routes/documents.js';
import usersRoutes from './backend/routes/users.js';
import { initDB } from './backend/initDB.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('backend/uploads'));

// Inicializar DB
initDB();

// Rutas
app.use('/auth', authRoutes);
app.use('/documents', documentsRoutes);
app.use('/users', usersRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
