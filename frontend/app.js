const API_URL = '/api';
const app = document.getElementById('app');

let currentUser = null;
let selectedTeacher = null;

// =======================
// Pantalla de Login / Registro
// =======================
function renderLogin() {
  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <h1 class="login-title">Gestor Escolar</h1>
        <input type="email" id="email" placeholder="Correo electrónico">
        <input type="password" id="password" placeholder="Contraseña">
        <button id="loginBtn">Iniciar sesión</button>
        <p class="toggle-link">¿No tienes cuenta? <a id="goRegister">Regístrate</a></p>
      </div>
    </div>
  `;

  document.getElementById('loginBtn').onclick = handleLogin;
  document.getElementById('goRegister').onclick = renderRegister;
}

function renderRegister() {
  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <h1 class="login-title">Registro</h1>
        <input type="text" id="nombre" placeholder="Nombre">
        <input type="text" id="apellidoP" placeholder="Apellido Paterno">
        <input type="text" id="apellidoM" placeholder="Apellido Materno">
        <input type="email" id="email" placeholder="Correo electrónico">
        <input type="password" id="password" placeholder="Contraseña">
        <select id="role">
          <option value="teacher">Profesor</option>
        </select>
        <button id="registerBtn">Registrar</button>
        <p class="toggle-link">¿Ya tienes cuenta? <a id="goLogin">Inicia sesión</a></p>
      </div>
    </div>
  `;

  document.getElementById('registerBtn').onclick = handleRegister;
  document.getElementById('goLogin').onclick = renderLogin;
}

// =======================
// Funciones de autenticación
// =======================
async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!email || !password) return alert('Completa todos los campos');

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || 'Error al iniciar sesión');

  localStorage.setItem('token', data.token);
  currentUser = data.user;
  renderDashboard();
}

async function handleRegister() {
  const nombre = document.getElementById('nombre').value.trim();
  const apellidoP = document.getElementById('apellidoP').value.trim();
  const apellidoM = document.getElementById('apellidoM').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;

  if (!nombre || !apellidoP || !apellidoM || !email || !password)
    return alert('Completa todos los campos');

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, apellidoP, apellidoM, email, password, role })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || 'Error al registrar usuario');

  alert('✅ Registro exitoso. Ahora puedes iniciar sesión.');
  renderLogin();
}

// =======================
// Dashboard general
// =======================
function renderDashboard() {
  if (currentUser.role === 'director') {
    renderDirectorDashboard();
  } else {
    renderTeacherDashboard();
  }
}

// =======================
// Dashboard del Director
// =======================
async function renderDirectorDashboard() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const teachers = await res.json();

  app.innerHTML = `
    <header class="header">
      <h2>👨‍🏫 Director: ${currentUser.nombre} ${currentUser.apellidoP} ${currentUser.apellidoM}</h2>
      <button class="logout-btn" id="logoutBtn">Cerrar sesión</button>
    </header>
    <div class="teachers-list">
      ${teachers
        .filter(u => u.role === 'teacher')
        .map(
          t => `
        <div class="teacher-card" data-id="${t.id}">
          <div class="teacher-info">
            <div class="avatar">${t.nombre.charAt(0)}</div>
            <div>
              <p class="teacher-name">${t.nombre} ${t.apellidoP} ${t.apellidoM}</p>
              <p class="teacher-email">${t.email}</p>
            </div>
          </div>
        </div>`
        )
        .join('')}
    </div>
    <div id="teacherFiles"></div>
  `;

  document.getElementById('logoutBtn').onclick = logout;
  document.querySelectorAll('.teacher-card').forEach(card => {
    card.onclick = () => {
      const teacherId = card.dataset.id;
      selectedTeacher = teacherId;
      loadTeacherFiles(teacherId);
    };
  });
}

async function loadTeacherFiles(teacherId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/documents/${teacherId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const files = await res.json();

  const container = document.getElementById('teacherFiles');
  container.innerHTML = `
    <h3 class="section-title">📁 Archivos del profesor</h3>
    <div class="files-grid">
      ${
        files.length
          ? files
              .map(
                f => `<a class="file-item" href="${f.url}" target="_blank">${f.name}</a>`
              )
              .join('')
          : '<p class="no-files">No hay archivos</p>'
      }
    </div>
  `;
}

// =======================
// Dashboard del Profesor
// =======================
async function renderTeacherDashboard() {
  app.innerHTML = `
    <header class="header">
      <h2>👨‍🏫 ${currentUser.nombre} ${currentUser.apellidoP} ${currentUser.apellidoM}</h2>
      <button class="logout-btn" id="logoutBtn">Cerrar sesión</button>
    </header>
    <div class="upload-section">
      <h3>Subir archivo</h3>
      <input type="file" id="fileInput">
      <button id="uploadBtn">Subir</button>
    </div>
    <div class="files-section">
      <h3>Mis archivos</h3>
      <div id="fileList"></div>
    </div>
  `;

  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('uploadBtn').onclick = uploadFile;
  loadMyFiles();
}

async function loadMyFiles() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/documents/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const files = await res.json();

  const list = document.getElementById('fileList');
  list.innerHTML = files.length
    ? files.map(f => `<a href="${f.url}" target="_blank">${f.name}</a>`).join('<br>')
    : '<p class="no-files">No hay archivos</p>';
}

async function uploadFile() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert('Selecciona un archivo');

  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return alert(data.error || 'Error al subir el archivo');
  }

  alert('✅ Archivo subido correctamente');
  loadMyFiles();
}

// =======================
// Cerrar sesión
// =======================
function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  renderLogin();
}

// =======================
// Verificar sesión al iniciar
// =======================
async function checkSession() {
  const token = localStorage.getItem('token');
  if (!token) return renderLogin();

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return renderLogin();

  const data = await res.json();
  currentUser = data;
  renderDashboard();
}

checkSession();
