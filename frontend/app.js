// frontend/app.js
const API = ""; // servidor sirve frontend y backend en mismo origen, así que '' usará host actual
const app = document.getElementById("app");

function getToken() { return localStorage.getItem("token"); }
function authHeaders() { return { Authorization: "Bearer " + getToken() }; }

// VISTA: Login
function showLogin() {
  app.innerHTML = `
    <div class="card">
      <!-- Aquí irá el logo (comentado) -->
      <h1>Iniciar sesión</h1>
      <form id="loginForm">
        <input id="email" type="email" placeholder="Correo" required />
        <input id="password" type="password" placeholder="Contraseña" required />
        <button type="submit">Entrar</button>
      </form>
      <p style="margin-top:10px;">¿No tienes cuenta? <a id="goRegister" href="#">Regístrate</a></p>
    </div>
  `;
  document.getElementById("goRegister").onclick = (e) => { e.preventDefault(); showRegister(); };
  document.getElementById("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        // If director -> dashboard, else -> profesor view
        if (data.user.role === "director") loadDirectorDashboard();
        else loadProfessorView();
      } else {
        alert(data.error || "Error al iniciar sesión");
      }
    } catch (err) {
      console.error(err); alert("Error de conexión");
    }
  };
}

// VISTA: Registro
function showRegister() {
  app.innerHTML = `
    <div class="card">
      <h1>Registro</h1>
      <form id="registerForm">
        <input id="firstName" placeholder="Nombres" required />
        <input id="lastP" placeholder="Apellido paterno" required />
        <input id="lastM" placeholder="Apellido materno (opcional)" />
        <input id="email" type="email" placeholder="Correo" required />
        <input id="password" type="password" placeholder="Contraseña" required />
        <label>Grado</label>
        <select id="grade" required>
          <option value="1">1</option><option value="2">2</option><option value="3">3</option>
        </select>
        <label>Grupo</label>
        <select id="groupName" required>
          <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option>
        </select>
        <button type="submit">Registrar</button>
      </form>
      <p style="margin-top:10px;">¿Ya tienes cuenta? <a id="goLogin" href="#">Ingresar</a></p>
    </div>
  `;
  document.getElementById("goLogin").onclick = (e) => { e.preventDefault(); showLogin(); };
  document.getElementById("registerForm").onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      firstName: document.getElementById("firstName").value,
      lastP: document.getElementById("lastP").value,
      lastM: document.getElementById("lastM").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      grade: document.getElementById("grade").value,
      groupName: document.getElementById("groupName").value
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert("Registrado correctamente. Inicia sesión.");
        showLogin();
      } else {
        alert(data.error || "Error al registrar");
      }
    } catch (err) {
      console.error(err); alert("Error de conexión");
    }
  };
}

// Dashboard director organizado por grado y grupo
async function loadDirectorDashboard() {
  try {
    const res = await fetch("/api/documents", { headers: authHeaders() });
    const data = await res.json();
    const byGrade = data.byGrade || {};
    app.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h1>Dashboard Director</h1><div><button id="logoutBtn">Cerrar sesión</button></div></div><div id="content"></div>`;
    document.getElementById("logoutBtn").onclick = () => { localStorage.removeItem("token"); showLogin(); };

    const content = document.getElementById("content");
    // Mostrar grados 1..3
    for (const grade of [1,2,3]) {
      const gradeSec = document.createElement("div"); gradeSec.className = "section";
      gradeSec.innerHTML = `<div class="grade-title"><strong>Grado ${grade}</strong></div>`;
      const groupContainer = document.createElement("div"); groupContainer.className = "group-row";
      const groups = byGrade[grade] || {};
      // Mostrar grupos A..F (incluso si vacíos)
      for (const group of ["A","B","C","D","E","F"]) {
        const box = document.createElement("div");
        box.style.minWidth = "240px";
        box.innerHTML = `<div style="margin-bottom:8px;font-weight:700">${grade}° ${group}</div>`;
        const groupArr = groups[group] || [];
        if (groupArr.length === 0) {
          box.innerHTML += `<div style="color:#666">Sin profesores</div>`;
        } else {
          for (const prof of groupArr) {
            const pEl = document.createElement("div");
            pEl.className = "professor-item";
            pEl.innerHTML = `
              <div style="display:flex;align-items:center">
                <div class="professor-icon">${prof.firstName.charAt(0).toUpperCase()}</div>
                <div class="professor-details">
                  <div class="prof-name">${prof.firstName} ${prof.lastP}</div>
                  <div class="prof-sub">${prof.email}</div>
                </div>
              </div>
            `;
            pEl.onclick = () => showProfessorDocsAsDirector(prof);
            box.appendChild(pEl);
          }
        }
        groupContainer.appendChild(box);
      }
      gradeSec.appendChild(groupContainer);
      content.appendChild(gradeSec);
    }
  } catch (err) {
    console.error(err); alert("Error al cargar dashboard");
  }
}

// Mostrar documentos de un profesor (vista director)
async function showProfessorDocsAsDirector(professor) {
  try {
    // Abrir panel con datos del profesor; la API /api/users/professors ya incluye docs? mejor llamar /api/users/professors-> but we have data already
    const content = document.getElementById("content");
    content.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h2>${professor.firstName} ${professor.lastP}</h2><div><button id="backBtn">Volver</button></div></div>
      <div id="docsArea"></div>
    `;
    document.getElementById("backBtn").onclick = loadDirectorDashboard;

    // Obtener documentos desde backend (ruta /api/users/professors ya no trae docs individuales; pedimos /api/documents y filtramos)
    const res = await fetch("/api/documents", { headers: authHeaders() });
    const all = await res.json();
    // all.byGrade contains nested lists; find professor.id
    const docs = [];
    const byGrade = all.byGrade || {};
    for (const g of Object.keys(byGrade)) {
      for (const gp of Object.keys(byGrade[g])) {
        for (const p of byGrade[g][gp]) {
          if (p.id === professor.id) {
            docs.push(...(p.documents || []));
          }
        }
      }
    }

    const docsArea = document.getElementById("docsArea");
    if (!docs || docs.length === 0) {
      docsArea.innerHTML = "<p>No hay documentos</p>";
    } else {
      docsArea.innerHTML = "";
      docs.forEach(d => {
        const f = document.createElement("div");
        f.className = "file-item";
        f.innerHTML = `<div>${d.title}</div><div><a href="${d.driveDownloadLink}" target="_blank">Descargar</a></div>`;
        docsArea.appendChild(f);
      });
    }
  } catch (err) {
    console.error(err); alert("Error al obtener documentos");
  }
}

// Vista profesor (mis documentos + subir)
async function loadProfessorView() {
  try {
    const res = await fetch("/api/documents", { headers: authHeaders() });
    const data = await res.json();
    const docs = data.documents || [];
    app.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h1>Mis Documentos</h1><div><button id="logoutBtn">Cerrar sesión</button></div></div>
      <div id="docs"></div>
      <div class="card upload-card">
        <h3>Subir documento</h3>
        <form id="uploadForm">
          <input id="title" placeholder="Título (opcional)" />
          <input id="fileInput" type="file" required />
          <button type="submit">Subir</button>
        </form>
      </div>
    `;
    document.getElementById("logoutBtn").onclick = () => { localStorage.removeItem("token"); showLogin(); };

    const docsDiv = document.getElementById("docs");
    if (docs.length === 0) docsDiv.innerHTML = "<p>No tienes documentos</p>";
    else {
      docsDiv.innerHTML = "";
      docs.forEach(d => {
        const div = document.createElement("div");
        div.className = "file-item";
        div.innerHTML = `<div>${d.title}</div><div><a href="${d.driveDownloadLink}" target="_blank">Descargar</a></div>`;
        docsDiv.appendChild(div);
      });
    }

    document.getElementById("uploadForm").onsubmit = async (e) => {
      e.preventDefault();
      const file = document.getElementById("fileInput").files[0];
      const title = document.getElementById("title").value || file.name;
      if (!file) return alert("Selecciona un archivo");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      try {
        const res2 = await fetch("/api/documents/upload", {
          method: "POST",
          headers: authHeaders(),
          body: fd
        });
        const data2 = await res2.json();
        if (data2.success) {
          alert("Archivo subido");
          loadProfessorView();
        } else {
          alert(data2.error || "Error al subir");
        }
      } catch (err) {
        console.error(err); alert("Error de subida");
      }
    };

  } catch (err) {
    console.error(err); alert("Error al cargar vista");
  }
}

// Decide vista según role al iniciar con token
async function initApp() {
  if (!getToken()) return showLogin();
  // Validar token pidiendo /api/documents (que usa verifyToken). Si falla, ir a login.
  try {
    const res = await fetch("/api/documents", { headers: authHeaders() });
    const data = await res.json();
    // Si es director, loadDirectorDashboard; si tiene documents key -> profesor
    if (data.byGrade) loadDirectorDashboard();
    else loadProfessorView();
  } catch (err) {
    console.error(err);
    showLogin();
  }
}

function loadProfessorDashboard() { loadProfessorView(); } // alias

// Init
initApp();
