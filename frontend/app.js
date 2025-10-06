// frontend/app.js
const API = 'https://gestor-escolar-rvdh.onrender.com/api';
const app = document.getElementById('app');

function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }

// ====== Login ======
function showLogin() {
  app.innerHTML = `
    <h1>Login</h1>
    <input placeholder="Email" id="email"/><br/>
    <input placeholder="Password" id="password" type="password"/><br/>
    <button id="loginBtn">Login</button>
    <p>¿No tienes cuenta? <a href="#" id="showRegister">Regístrate</a></p>
  `;
  document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) { setToken(data.token); loadDashboard(); }
      else alert(data.message || 'Error en login');
    } catch (err) { console.error(err); alert('Error de conexión con el servidor'); }
  };
  document.getElementById('showRegister').onclick = showRegister;
}

// ====== Registro ======
function showRegister() {
  app.innerHTML = `
    <h1>Registro</h1>
    <input placeholder="Nombre" id="name"/><br/>
    <input placeholder="Email" id="email"/><br/>
    <input placeholder="Password" id="password" type="password"/><br/>
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (res.ok && data.token) { setToken(data.token); loadDashboard(); }
      else alert(data.message || 'Error en registro');
    } catch (err) { console.error(err); alert('Error de conexión con el servidor'); }
  };
  document.getElementById('showLogin').onclick = showLogin;
}

// ====== Dashboard ======
async function loadDashboard() {
  try {
    const res = await fetch(API + '/documents', { headers: { Authorization: 'Bearer ' + getToken() } });
    const data = await res.json();
    app.innerHTML = `<h1>Dashboard</h1><button id="logoutBtn">Logout</button><div id="content"></div>`;
    document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('token'); showLogin(); };
    const content = document.getElementById('content');

    if (data.professors) {
      // Vista director
      data.professors.forEach(p => {
        const div = document.createElement('div');
        div.innerHTML = `<span class="folder">${p.name}</span>`;
        div.onclick = () => { showProfessorDocs(p); };
        content.appendChild(div);
      });
    } else {
      // Vista profesor
      showDocs(content, data.documents);
      showUploadForm(content);
    }
  } catch (err) { console.error(err); alert('Error cargando dashboard'); }
}

// ====== Mostrar documentos de un profesor ======
function showProfessorDocs(professor) {
  const content = document.getElementById('content');
  content.innerHTML = `<h2>${professor.name}</h2><button id="backBtn">Volver</button><div id="docs"></div>`;
  document.getElementById('backBtn').onclick = loadDashboard;
  showDocs(document.getElementById('docs'), professor.documents);
}

// ====== Mostrar documentos ======
function showDocs(container, documents) {
  container.innerHTML = '';
  if (!documents || documents.length === 0) { container.innerHTML = '<p>No hay documentos</p>'; return; }
  documents.forEach(doc => {
    const div = document.createElement('div');
    div.innerHTML = `<a href="https://gestor-escolar-rvdh.onrender.com/uploads/${doc.filepath}" target="_blank">${doc.title}</a>`;
    container.appendChild(div);
  });
}

// ====== Formulario de subida ======
function showUploadForm(container) {
  const form = document.createElement('form');
  form.innerHTML = `<input type="file" id="fileInput"/><button>Subir</button>`;
  form.onsubmit = async e => {
    e.preventDefault();
    const file = document.getElementById('fileInput').files[0];
    if (!file) return alert('Selecciona un archivo');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name);
    try {
      const res = await fetch(API + '/documents/upload', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
        body: fd
      });
      const data = await res.json();
      if (res.ok) { alert('Archivo subido'); loadDashboard(); }
      else alert(data.message || 'Error al subir archivo');
    } catch (err) { console.error(err); alert('Error al subir archivo'); }
  };
  container.appendChild(form);
}

// ====== Inicialización ======
if (getToken()) loadDashboard(); else showLogin();
