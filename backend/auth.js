const jwt = require('jsonwebtoken');
const { User } = require('./models'); // Ajusta la ruta si es necesario
const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro';

// Generar token JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '1h' }
  );
}

// Middleware para proteger rutas
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid token format' });

  try {
    const payload = jwt.verify(token, SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Middleware para verificar roles
function roleRequired(roles = []) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}

// Exportar todo
module.exports = { generateToken, authMiddleware, roleRequired };
