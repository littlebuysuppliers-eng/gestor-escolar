const jwt = require('jsonwebtoken');
const { User } = require('./models');
const jwtSecret = process.env.JWT_SECRET || 'secret';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
}

async function authMiddleware(req, res, next) {
  let token = null;

  // Token desde headers
  if (req.headers.authorization) token = req.headers.authorization.split(' ')[1];

  // Token desde FormData (si es POST con multipart)
  if (!token && req.body && req.body.token) token = req.body.token;

  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const data = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(data.id);
    if (!user) return res.status(401).json({ message: 'Invalid user' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function roleRequired(roles = []) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { generateToken, authMiddleware, roleRequired };
