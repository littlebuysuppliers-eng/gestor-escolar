import { API_URL } from './config.js'; // Puedes definir tu URL API aquí

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

if (!token || !user) {
  window.location.href = '/';
}

// === Panel Director ===
if (user.role === 'director') {
  document.getElementById('directorPanel').style.display = 'block';
  loadProfessors();
}

// === Panel Profesor ===
if (user.role === 'teacher') {
  document.getElementById('teacherPanel').style.display = 'block';
  loadMyFiles();

  document.getElementById('uploadBtn').addEventListener('click', uploadFile);
}

// ===================== FUNCIONES =====================

async function loadProfessors() {
  const res = await fetch(`${API_URL}/auth/allTeachers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const teachers = await res.json();
  const ul = document.getElementById('professorsList');
  ul.innerHTML = '';

  teachers.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t.name;
    li.style.cursor = 'pointer';
    li.onclick = () => loadTeacherFiles(t.id);
    ul.appendChild(li);
  });
}

async function loadTeacherFiles(teacherId) {
  const res = await fetch(`${API_URL}/documents/user/${teacherId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const files = await res.json();
  const container = document.getElementById('profFiles');
  container.innerHTML = `<h3>Archivos de ${teacherId}</h3>`;

  files.forEach(f => {
    const div = document.createElement('div');
    div.innerHTML = `
      ${f.title} - <a href="${f.url}" target="_blank">Descargar</a>
    `;
    container.appendChild(div);
  });
}

async function loadMyFiles() {
  const res = await fetch(`${API_URL}/documents/user/${user.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const files = await res.json();
  const ul = document.getElementById('myFilesList');
  ul.innerHTML = '';

  files.forEach(f => {
    const li = document.createElement('li');
    li.textContent = f.title + ' ';
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Eliminar';
    delBtn.onclick = () => deleteFile(f.id);
    li.appendChild(delBtn);
    ul.appendChild(li);
  });
}

async function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files.length) return alert('Selecciona un archivo');

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (res.ok) {
    alert('Archivo subido');
    loadMyFiles();
  } else {
    alert('Error al subir archivo');
  }
}

async function deleteFile(fileId) {
  const res = await fetch(`${API_URL}/documents/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    alert('Archivo eliminado');
    loadMyFiles();
  } else {
    alert('Error al eliminar archivo');
  }
}
