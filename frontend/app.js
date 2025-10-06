console.log("✅ app.js cargado correctamente");
document.getElementById('app').innerHTML = "<h2>Frontend funcionando ✅</h2>";
/*const API = location.origin + '/api';
const app = document.getElementById('app');

function getToken(){ return localStorage.getItem('token'); }
function setToken(t){ localStorage.setItem('token',t); }

function showLogin(){
  app.innerHTML=`<h1>Login</h1>
  <input placeholder="Email" id="email"/><br/>
  <input placeholder="Password" id="password" type="password"/><br/>
  <button id="loginBtn">Login</button>`;
  document.getElementById('loginBtn').onclick=async()=>{
    const email=document.getElementById('email').value;
    const password=document.getElementById('password').value;
    const res = await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data = await res.json();
    if(data.token){ setToken(data.token); loadDashboard(); } else alert('Error login');
  };
}

async function loadDashboard(){
  const res = await fetch(API+'/documents',{headers:{Authorization:'Bearer '+getToken()}});
  const data = await res.json();
  app.innerHTML=<h1>Dashboard</h1><button id="logoutBtn">Logout</button><div id="content"></div>;
  document.getElementById('logoutBtn').onclick=()=>{ localStorage.removeItem('token'); showLogin(); };
  const content=document.getElementById('content');
  if(data.professors){
    // director view
    data.professors.forEach(p=>{
      const div=document.createElement('div');
      div.innerHTML=<span class="folder">${p.name}</span>;
      div.onclick=()=>{ showProfessorDocs(p); };
      content.appendChild(div);
    });
  } else {
    // teacher view
    showDocs(content, data.documents);
    showUploadForm(content);
  }
}


function*/
