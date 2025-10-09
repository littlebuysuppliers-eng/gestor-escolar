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
    <input id="email" type="email" placeholder="Email" required />
    <input id="password" type="password" placeholder="Contraseña" required />
    <label>Rol</label>
    <select id="role"><option value="teacher">Profesor</option><option value="director">Director</option></select>
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
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      role: document.getElementById('role').value
    };
    const res = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    if(res.ok){ alert('Registrado'); showLogin(); } else { document.getElementById('msg').innerText = data.error || data.message; }
  };
}

async function loadDashboard(){
  const token = getToken();
  if(!token) return showLogin();
  const role = localStorage.getItem('role');
  app.innerHTML = `<div class="topbar"><h1>Dashboard</h1><div><button id="logout">Cerrar sesión</button></div></div><div id="content"></div>`;
  document.getElementById('logout').onclick = ()=>{ localStorage.clear(); showLogin(); };
  const content = document.getElementById('content');

  if(role === 'director'){
    // director view by name
    const res = await fetch('/api/documents',{headers:authHeaders()});
    const data = await res.json();
    const byName = data.byName || {};
    for(const name in byName){
      const box = document.createElement('div');
      box.innerHTML = `<h3>${name}</h3>`;
      const docs = byName[name] || [];
      if(docs.length===0) box.innerHTML += '<p>Sin documentos</p>';
      else docs.forEach(d=>{
        const f = document.createElement('div'); f.className='file-item';
        f.innerHTML = `<div>${d.title}</div><div><a href="${d.driveDownloadLink}" target="_blank">Descargar</a> <button data-id="${d.id}" class="delBtn">Eliminar</button></div>`;
        box.appendChild(f);
      });
      content.appendChild(box);
    }
    // handle delete
    content.addEventListener('click', async (e)=>{
      if(e.target.classList.contains('delBtn')){
        const id = e.target.dataset.id;
        if(!confirm('Eliminar documento?')) return;
        const res = await fetch('/api/documents/delete',{method:'POST',headers:Object.assign({'Content-Type':'application/json'},authHeaders()),body:JSON.stringify({documentId:id})});
        const data = await res.json();
        if(res.ok) { alert('Eliminado'); loadDashboard(); } else alert(data.error || 'Error');
      }
    });
  } else {
    // professor view
    const res = await fetch('/api/documents',{headers:authHeaders()});
    const data = await res.json();
    const docs = data.documents || [];
    const docsDiv = document.createElement('div'); docsDiv.id='docs';
    if(docs.length===0) docsDiv.innerHTML='<p>No tienes documentos</p>';
    else docs.forEach(d=>{
      const f = document.createElement('div'); f.className='file-item';
      f.innerHTML = `<div>${d.title}</div><div><a href="${d.driveDownloadLink}" target="_blank">Descargar</a> <button data-id="${d.id}" class="delBtn">Eliminar</button></div>`;
      docsDiv.appendChild(f);
    });
    content.appendChild(docsDiv);
    const upForm = document.createElement('form'); upForm.innerHTML = `<input id="fileInput" type="file" required /><button>Subir</button>`;
    content.appendChild(upForm);
    upForm.onsubmit = async e=>{
      e.preventDefault();
      const file = document.getElementById('fileInput').files[0];
      if(!file) return alert('Selecciona un archivo');
      const fd = new FormData(); fd.append('file', file);
      const res2 = await fetch('/api/documents/upload',{method:'POST',headers:authHeaders(),body:fd});
      const data2 = await res2.json();
      if(res2.ok){ alert('Subido'); loadDashboard(); } else alert(data2.error || 'Error');
    };
    // delete handler
    content.addEventListener('click', async (e)=>{
      if(e.target.classList.contains('delBtn')){
        const id = e.target.dataset.id;
        if(!confirm('Eliminar documento?')) return;
        const res = await fetch('/api/documents/delete',{method:'POST',headers:Object.assign({'Content-Type':'application/json'},authHeaders()),body:JSON.stringify({documentId:id})});
        const data = await res.json();
        if(res.ok) { alert('Eliminado'); loadDashboard(); } else alert(data.error || 'Error');
      }
    });
  }
}

// init
(async ()=>{ const token = getToken(); if(!token) showLogin(); else loadDashboard(); })();
