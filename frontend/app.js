// app.js

const apiUrl = "https://gestor-escolar-rvdh.onrender.com/api"; // tu backend en Render
const token = localStorage.getItem("token");
const userRole = localStorage.getItem("role");
const userName = localStorage.getItem("userName");

// Mostrar nombre del usuario en el header
document.addEventListener("DOMContentLoaded", () => {
  const userDisplay = document.getElementById("user-name");
  if (userDisplay && userName) {
    userDisplay.textContent = userName;
  }

  if (userRole === "director") {
    cargarProfesores();
  } else if (userRole === "profesor") {
    cargarArchivosPropios();
  }
});

// ==========================
// 🔹 Cargar lista de profesores
// ==========================
async function cargarProfesores() {
  try {
    const response = await fetch(`${apiUrl}/users/profesores`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profesores = await response.json();

    const select = document.getElementById("profesorSelect");
    select.innerHTML = '<option value="">Seleccionar profesor</option>';

    profesores.forEach((prof) => {
      const option = document.createElement("option");
      option.value = prof.id;
      option.textContent = prof.name;
      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      const profesorId = select.value;
      if (profesorId) cargarArchivosPorProfesor(profesorId);
    });
  } catch (error) {
    console.error("Error al cargar profesores:", error);
  }
}

// ==========================
// 🔹 Cargar archivos del profesor seleccionado
// ==========================
async function cargarArchivosPorProfesor(profesorId) {
  try {
    const response = await fetch(`${apiUrl}/documents/profesor/${profesorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("No se pudieron obtener los archivos");
    const archivos = await response.json();

    const lista = document.getElementById("documentList");
    lista.innerHTML = "";

    if (archivos.length === 0) {
      lista.innerHTML = "<p>No hay archivos para este profesor.</p>";
      return;
    }

    archivos.forEach((doc) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${doc.filename}</span>
        <a href="${apiUrl}/documents/${doc.filename}" target="_blank" class="btn-ver">Ver</a>
      `;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error("Error al cargar archivos del profesor:", error);
  }
}

// ==========================
// 🔹 Cargar archivos del profesor logueado
// ==========================
async function cargarArchivosPropios() {
  try {
    const response = await fetch(`${apiUrl}/documents/mios`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const archivos = await response.json();
    const lista = document.getElementById("documentList");
    lista.innerHTML = "";

    if (archivos.length === 0) {
      lista.innerHTML = "<p>No has subido ningún archivo.</p>";
      return;
    }

    archivos.forEach((doc) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${doc.filename}</span>
        <a href="${apiUrl}/documents/${doc.filename}" target="_blank" class="btn-ver">Ver</a>
      `;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error("Error al cargar tus archivos:", error);
  }
}

// ==========================
// 🔹 Subir archivo
// ==========================
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return alert("Selecciona un archivo antes de subirlo");

    const formData = new FormData();
    formData.append("document", file);

    try {
      const response = await fetch(`${apiUrl}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        alert("Archivo subido con éxito ✅");
        fileInput.value = "";
        if (userRole === "profesor") cargarArchivosPropios();
      } else {
        alert("Error al subir el archivo ❌");
      }
    } catch (error) {
      console.error("Error al subir:", error);
      alert("Error de conexión con el servidor");
    }
  });
}
