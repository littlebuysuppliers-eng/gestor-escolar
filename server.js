require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { init, User } = require('./models');
const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/documents');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname,'frontend')));
app.get('/',(req,res)=>{
	res.sendFile(path.join(__dirname, 'frontend','index.html'));
});
app.use('/uploads',express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

const PORT = process.env.PORT||4000;

async function start(){
  await init();
  // Crear director demo
  const d = await User.findOne({ where:{role:'director'} });
  if(!d){
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('directorpass',10);
    await User.create({ name:'Director Demo', email:'director@school.test', passwordHash:hash, role:'director' });
    console.log('Director creado: director@school.test / directorpass');
  }
  app.listen(PORT,()=>console.log('Server running on port',PORT));
}

start();
