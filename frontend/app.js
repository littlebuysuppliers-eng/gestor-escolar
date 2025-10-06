const API = location.origin + '/api';
const app = document.getElementById('app');

// ----- TOKEN -----
function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }

// ----- LOGIN -----
function showLogin() {
  app.innerHTML = `
    <h1>Login</h1>
    <input placeholder="Email" id="email"/><br/>
    <input placeholder="Password" id="password" type="password"/><br/>
    <button id="loginBtn">Login</button>
    <p>¿No tienes cuenta? <a href="#" id="registerLink">Regístrate</a></p>
  `;

  document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      loadDashboard();
    } else alert('Error login');
  };

  document.getElementById('registerLink').onclick = (e) => {
    e.preventDefault();
    showRegister();
  };
}

// ----- REGISTRO -----
function showRegister() {
  app.innerHTML = `
    <h1>Registro</h1>
    <input placeholder="Nombre" id="name"/><br/>
    <input placeholder="Email" id="email"/><br/>
    <input placeholder="Password" id="password" type="password"/><br/>
    <button id="registerBtn">Registrarse</button>
    <p>¿Ya tienes cuenta? <a href="#" id="loginLink">Login</a></p>
  `;

  document.getElementById('registerBtn').onclick = async () => {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch(API + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (res.ok) {
      alert('Registro exitoso. Ahora inicia sesión.');
      showLogin();
    } else {
      const data = await res.json();
      alert('Error: ' + (data.message || 'No se pudo registrar'));
    }
  };

  document.getElementById('loginLink').onclick = (e) => {
    e.preventDefault();
    showLogin();
  };
}

// ----- DASHBOARD -----
async function loadDashboard() {
  const res = await fetch(API + '/documents', {
    headers: { Authorization: 'Bearer ' + getToken() }
  });
  const data = await res.json();

  app.innerHTML = `
    <h1>Dashboard</h1>
    <button id="logoutBtn">Logout</button>
    <div id="content"></div>
  `;

  document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('token');
    showLogin();
  };

  const content = document.getElementById('content');

  if (data.professors) {
    data.professors.forEach(p => {
      const div = document.createElement('div');
      div.className = 'folder';
      div.innerText = p.name;
      div.onclick = () => { showProfessorDocs(p); };
      content.appendChild(div);
    });
  } else {
    showDocs(content, data.documents);
    showUploadForm(content);
  }
}

// ----- MOSTRAR DOCUMENTOS -----
function showDocs(container, documents) {
  const ul = document.createElement('ul');
  documents.forEach(doc => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${location.origin}/backend/uploads/${doc.filename}" target="_blank">${doc.originalName}</a>`;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

// ----- SUBIR ARCHIVOS -----
function showUploadForm(container) {
  const form = document.createElement('form');
  form.innerHTML = `
    <input type="file" id="fileInput"/><br/>
    <button type="submit">Subir</button>
    <div id="uploadStatus"></div>
  `;

  form.onsubmit = async e => {
    e.preventDefault();
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const res = await fetch(API + '/documents', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + getToken() },
      body: formData
    });

    if (res.ok) {
      document.getElementById('uploadStatus').innerText = 'Archivo subido correctamente';
      loadDashboard();
    } else {
      document.getElementById('uploadStatus').innerText = 'Error al subir';
    }
  };

  container.appendChild(form);
}

// ----- VER DOCUMENTOS DE PROFESOR (director) -----
function showProfessorDocs(professor) {
  app.innerHTML = `
    <h2>Documentos de ${professor.name}</h2>
    <button id="backBtn">Volver</button>
    <div id="content"></div>
  `;

  document.getElementById('backBtn').onclick = loadDashboard;

  const content = document.getElementById('content');
  showDocs(content, professor.documents);
}

// ----- INICIO -----
if (getToken()) loadDashboard();
else showLogin();
