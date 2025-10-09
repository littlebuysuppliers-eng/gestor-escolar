const API = '';
const app = document.getElementById('app');

function getToken(){ return localStorage.getItem('token'); }
function authHeaders(){ return { Authorization: 'Bearer ' + getToken() }; }

function showLogin(){
  app.innerHTML = `<h1>Iniciar sesión</h1>
  <form id="loginForm">
    <input id="email" type="email" placeholder="Email" required />
    <input id="password" type="password" placeholder="Contraseña" required />
    <button>Ingresar</button>
  </form>
  <p><a id="goRegister" href="#">Registrarse</a></p>
  <div id="msg"></div>`;
  document.getElementById('goRegister').onclick = (e)=>{ e.preventDefault(); showRegister(); };
  document.getElementById('loginForm').onsubmit = async e=>{
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data = await res.json();
    if(res.ok){ localStorage.setItem('token', data.token); localStorage.setItem('role', data.role); loadDashboard(); }
    else { document.getElementById('msg').innerText = data.error || data.message || 'Error al iniciar sesión'; }
  };
}

function showRegister(){
  app.innerHTML = `<h1>Registrar</h1>
  <form id="regForm">
    <input id="firstName" placeholder="Nombres" required />
    <input id="lastP" placeholder="Apellido paterno" required />
    <input id="lastM" placeholder="Apellido materno" />
    <select id="grade" required><option value="">Grado</option><option>1</option><option>2</option><option>3</option></select>
    <select id="group" required><option value="">Grupo</option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option></select>
    <input id="email" type="email" placeholder="Email" required />
    <input id="password" type="password" placeholder="Contraseña" required />
    <button>Registrar</button>
  </form>
  <p><a id="goLogin" href="#">Volver al login</a></p>
  <div id="msg"></div>`;
  document.getElementById('goLogin').onclick = (e)=>{ e.preventDefault(); showLogin(); };
  document.getElementById('regForm').onsubmit = async e=>{
    e.preventDefault();
    const payload = {
      firstName: document.getElementById('firstName').value,
      lastP: document.getElementById('lastP').value,
      lastM: document.getElementById('lastM').value,
      grade: document.getElementById('grade').value,
      groupName: document.getElementById('group').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    };
    const res = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    if(res.ok){ alert('Registrado'); showLogin(); } else { document.getElementById('msg').innerText = data.error || data.message; }
  };
}

async function loadDashboard(){
  const token = getToken();
  if(!token) return showLogin();
  app.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h1>Dashboard</h1><button id="logout">Cerrar sesión</button></div><div id="content"></div>`;
  document.getElementById('logout').onclick = ()=>{ localStorage.clear(); showLogin(); };
  const res = await fetch('/api/documents',{headers:authHeaders()});
  const data = await res.json();
  if(data.byGrade){
    const content = document.getElementById('content');
    for(const grade of [1,2,3]){
      const h = document.createElement('h2'); h.innerText = 'Grado '+grade; content.appendChild(h);
      const groups = data.byGrade[grade] || {};
      for(const g of ['A','B','C','D','E','F']){
        const div = document.createElement('div'); div.innerHTML = `<h3>${grade} - ${g}</h3>`;
        const list = groups[g] || [];
        if(list.length===0){ div.innerHTML += '<p>Sin profesores</p>'; }
        else{
          list.forEach(p=>{
            const item = document.createElement('div'); item.className='professor-item';
            item.innerHTML = `<div><strong>${p.firstName} ${p.lastP}</strong><div style="font-size:12px">${p.email}</div></div><div>Ver</div>`;
            item.onclick = ()=> showProfessorDocsAsDirector(p);
            div.appendChild(item);
          });
        }
        content.appendChild(div);
      }
    }
  } else {
    // professor view
    showProfessorView();
  }
}

async function showProfessorDocsAsDirector(prof){
  const token = getToken();
  app.innerHTML = `<button id="back">Volver</button><h2>${prof.firstName} ${prof.lastP}</h2><div id="docs"></div>`;
  document.getElementById('back').onclick = loadDashboard;
  // fetch documents for this professor from grouped data (simple)
  const res = await fetch('/api/documents',{headers:authHeaders()});
  const data = await res.json();
  const byGrade = data.byGrade || {};
  let docs = [];
  for(const g in byGrade){
    for(const gp in byGrade[g]){
      byGrade[g][gp].forEach(p=>{ if(p.id===prof.id) docs = p.documents || []; });
    }
  }
  const docsDiv = document.getElementById('docs');
  if(docs.length===0) docsDiv.innerHTML='<p>No hay documentos</p>';
  else docs.forEach(d=>{
    const f = document.createElement('div'); f.className='file-item'; f.innerHTML=`<div>${d.title}</div><div><a href="${d.driveDownloadLink}" target="_blank">Descargar</a></div>`;
    docsDiv.appendChild(f);
  });
}

async function showProfessorView(){
  const res = await fetch('/api/documents',{headers:authHeaders()});
  const data = await res.json();
  const docs = data.documents || [];
  app.innerHTML = `<h1>Mis documentos</h1><div id="docs"></div><form id="uploadForm"><input id="fileInput" type="file" required /><button>Subir</button></form>`;
  const docsDiv = document.getElementById('docs');
  if(docs.length===0) docsDiv.innerHTML='<p>No tienes documentos</p>';
  else docs.forEach(d=>{
    const f = document.createElement('div'); f.className='file-item'; f.innerHTML=`<div>${d.title}</div><div><a href="${d.driveDownloadLink}" target="_blank">Descargar</a></div>`;
    docsDiv.appendChild(f);
  });
  document.getElementById('uploadForm').onsubmit = async e=>{
    e.preventDefault();
    const file = document.getElementById('fileInput').files[0];
    if(!file) return alert('Selecciona un archivo');
    const fd = new FormData(); fd.append('file', file);
    const res2 = await fetch('/api/documents/upload',{method:'POST',headers:authHeaders(),body:fd});
    const data2 = await res2.json();
    if(res2.ok){ alert('Subido'); loadDashboard(); } else { alert(data2.error || 'Error al subir'); }
  };
}

// Init
(async ()=>{ const token = getToken(); if(!token) showLogin(); else loadDashboard(); })();
