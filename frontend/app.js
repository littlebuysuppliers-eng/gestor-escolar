const API = 'https://TU_RENDER_URL.com'; // Cambiar por la URL de tu app
const app = document.getElementById('app');

// --- LOGIN ---
function showLogin() {
  app.innerHTML = `
    <h1>Iniciar sesión</h1>
    <form id="loginForm">
      <input type="email" id="email" placeholder="Email" required>
      <input type="password" id="password" placeholder="Contraseña" required>
      <button type="submit">Ingresar</button>
    </form>
    <button id="goRegister">Registrarse</button>
    <div id="msg"></div>
  `;

  document.getElementById('goRegister').onclick = showRegister;

  document.getElementById('loginForm').onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('rol', data.rol);
        localStorage.setItem('grado', data.grado);
        localStorage.setItem('grupo', data.grupo);
        loadDashboard();
      } else {
        document.getElementById('msg').innerText = data.message;
      }
    } catch (err) {
      console.error(err);
      document.getElementById('msg').innerText = 'Error al iniciar sesión';
    }
  };
}

// --- REGISTER ---
function showRegister() {
  app.innerHTML = `
    <h1>Registrar usuario</h1>
    <form id="registerForm">
      <input type="text" id="nombres" placeholder="Nombres" required>
      <input type="text" id="apPaterno" placeholder="Apellido Paterno" required>
      <input type="text" id="apMaterno" placeholder="Apellido Materno">
      <select id="grado" required>
        <option value="">Selecciona Grado</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
      <select id="grupo">
        <option value="">Selecciona Grupo</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
        <option value="E">E</option>
        <option value="F">F</option>
      </select>
      <input type="email" id="email" placeholder="Email" required>
      <input type="password" id="password" placeholder="Contraseña" required>
      <button type="submit">Registrar</button>
    </form>
    <button id="goLogin">Volver al login</button>
    <div id="msg"></div>
  `;

  document.getElementById('goLogin').onclick = showLogin;

  document.getElementById('registerForm').onsubmit = async e => {
    e.preventDefault();
    const nombres = document.getElementById('nombres').value;
    const ap_paterno = document.getElementById('apPaterno').value;
    const ap_materno = document.getElementById('apMaterno').value;
    const grado = document.getElementById('grado').value;
    const grupo = document.getElementById('grupo').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres, ap_paterno, ap_materno, grado, grupo, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Usuario registrado con éxito');
        showLogin();
      } else {
        document.getElementById('msg').innerText = data.message;
      }
    } catch (err) {
      console.error(err);
      document.getElementById('msg').innerText = 'Error al registrar usuario';
    }
  };
}

// --- DASHBOARD ---
async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) return showLogin();

  app.innerHTML = `<h1>Dashboard</h1><button id="logoutBtn">Cerrar sesión</button><div id="content"></div>`;
  document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    showLogin();
  };

  const content = document.getElementById('content');
  content.innerHTML = '';

  try {
    const res = await fetch(`${API}/users`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();

    // Agrupar por grado y grupo
    const grados = {};
    data.users.forEach(u => {
      if (!grados[u.grado]) grados[u.grado] = {};
      if (!grados[u.grado][u.grupo]) grados[u.grado][u.grupo] = [];
      grados[u.grado][u.grupo].push(u);
    });

    for (let grado in grados) {
      const hGrado = document.createElement('h2');
      hGrado.innerText = `Grado ${grado}`;
      content.appendChild(hGrado);

      for (let grupo in grados[grado]) {
        const hGrupo = document.createElement('h3');
        hGrupo.innerText = `Grupo ${grupo}`;
        content.appendChild(hGrupo);

        grados[grado][grupo].forEach(u => {
          const div = document.createElement('div');
          div.classList.add('professor-item');
          div.innerHTML = `
            <div class="professor-info">
              <span class="professor-name">${u.nombres} ${u.ap_paterno}</span>
              <span class="professor-sub">${u.email}</span>
            </div>
            <span class="status status-asist">Asiste</span>
          `;
          div.onclick = () => showProfessorDocs(u);
          content.appendChild(div);
        });
      }
    }

  } catch (err) {
    console.error(err);
    content.innerHTML = 'Error cargando usuarios';
  }
}

// --- Mostrar documentos ---
async function showProfessorDocs(user) {
  const token = localStorage.getItem('token');
  const content = document.getElementById('content');
  content.innerHTML = `<h2>${user.nombres} ${user.ap_paterno}</h2>
    <button id="backBtn">Volver</button>
    <div id="docs"></div>
    <form id="uploadForm">
      <input type="file" id="fileInput" required>
      <button type="submit">Subir archivo</button>
    </form>
  `;
  document.getElementById('backBtn').onclick = loadDashboard;

  const docsDiv = document.getElementById('docs');

  try {
    const res = await fetch(`${API}/documents/user/${user.id}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();

    if (!data.documents || data.documents.length === 0) {
      docsDiv.innerHTML = '<p>Este usuario no tiene documentos</p>';
    } else {
      data.documents.forEach(doc => {
        const div = document.createElement('div');
        div.classList.add('file-item');
        div.innerHTML = `
          <span>${doc.title}</span>
          <a href="/uploads/${doc.filepath}" target="_blank">Descargar</a>
          <span>${doc.status}</span>
        `;
        docsDiv.appendChild(div);
      });
    }

  } catch (err) {
    console.error(err);
    docsDiv.innerHTML = 'Error cargando documentos';
  }

  // Subir archivo
  document.getElementById('uploadForm').onsubmit = async e => {
    e.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/documents/upload/${user.id}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert('Archivo subido correctamente');
        showProfessorDocs(user);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error subiendo archivo');
    }
  };
}

// --- Inicializar ---
showLogin();
