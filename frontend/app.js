const API = 'https://gestor-escolar-rvdh.onrender.com/api';
const app = document.getElementById('app');

function getToken(){ return localStorage.getItem('token'); }
function setToken(t){ localStorage.setItem('token', t); }

// ====== Login ======
function showLogin(){
  app.innerHTML = `
    <h1>Login</h1>
    <input placeholder="Email" id="email"/><br/>
    <input placeholder="Password" type="password" id="password"/><br/>
    <button id="loginBtn">Login</button>
    <p>¿No tienes cuenta? <a href="#" id="showRegister">Regístrate</a></p>
  `;
  document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email,password})
      });
      const data = await res.json();
      if(res.ok && data.token){ setToken(data.token); loadDashboard(); }
      else alert(data.message || 'Error login');
    } catch(err){ alert('Error de conexión'); console.error(err); }
  };
  document.getElementById('showRegister').onclick = showRegister;
}

// ====== Registro ======
function showRegister(){
  app.innerHTML = `
    <h1>Registro</h1>
    <input placeholder="Nombre" id="name"/><br/>
    <input placeholder="Email" id="email"/><br/>
    <input placeholder="Password" type="password" id="password"/><br/>
    <select id="role">
      <option value="teacher">Profesor</option>
      <option value="director">Director</option>
    </select><br/>
    <button id="registerBtn">Registrar</button>
    <p>¿Ya tienes cuenta? <a href="#" id="showLogin">Login</a></p>
  `;
  document.getElementById('registerBtn').onclick = async () => {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
      const res = await fetch(API + '/auth/register', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({name,email,password,role})
      });
      const data = await res.json();
      if(res.ok && data.token){ setToken(data.token); loadDashboard(); }
      else alert(data.message || 'Error registro');
    } catch(err){ alert('Error de conexión'); console.error(err); }
  };
  document.getElementById('showLogin').onclick = showLogin;
}

// ====== Dashboard ======
async function loadDashboard(){
  try {
    const res = await fetch(API + '/documents', { headers:{Authorization:'Bearer '+getToken()} });
    const data = await res.json();

    app.innerHTML = `<h1>Dashboard</h1><button id="logoutBtn">Logout</button><div id="content"></div>`;
    document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('token'); showLogin(); };
    const content = document.getElementById('content');

    if(data.professors){
      data.professors.forEach(p=>{
        const div = document.createElement('div');
        div.innerHTML = `<span class="folder">${p.name}</span>`;
        div.onclick = ()=>showProfessorDocs(p);
        content.appendChild(div);
      });
    } else {
      showDocs(content,data.documents);
      showUploadForm(content);
    }
  } catch(err){ alert('Error cargando dashboard'); console.error(err); }
}

// ====== Documentos ======
function showProfessorDocs(professor){
  const content = document.getElementById('content');
  content.innerHTML = `<h2>${professor.name}</h2><button id="backBtn">Volver</button><div id="docs"></div>`;
  document.getElementById('backBtn').onclick = loadDashboard;
  showDocs(document.getElementById('docs'), professor.documents);
}

function showDocs(container, documents){
  container.innerHTML = '';
  if(!documents || documents.length===0){ container.innerHTML='<p>No hay documentos</p>'; return; }
  documents.forEach(doc=>{
    const div = document.createElement('div');
    div.innerHTML = `<a href="${API}/documents/download/${doc.id}" target="_blank">${doc.title}</a>`;
    container.appendChild(div);
  });
}

// ====== Subida archivos ======
function showUploadForm(container){
  const form = document.createElement('form');
  form.innerHTML = `<input type="file" id="fileInput"/><button>Subir</button>`;
  form.onsubmit = async e => {
    e.preventDefault();
    const file = document.getElementById('fileInput').files[0];
    if(!file){ alert('Selecciona un archivo'); return; }

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch(API + '/documents/upload', {
        method: 'POST',
        body: fd,
        headers: { 'Authorization': 'Bearer ' + getToken() } // solo así funciona con multer
      });
      const data = await res.json();
      if(res.ok){ alert('Archivo subido'); loadDashboard(); }
      else alert(data.message || 'Error al subir archivo');
    } catch(err){ alert('Error al subir archivo'); console.error(err); }
  };
  container.appendChild(form);
}

// ====== Inicialización ======
if(getToken()) loadDashboard(); else showLogin();
