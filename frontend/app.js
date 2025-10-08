document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const role = localStorage.getItem("role");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const nameElement = document.getElementById("user-name");
  if (nameElement) nameElement.textContent = userName || "Usuario";

  if (role === "director") {
    await cargarProfesores(token);
  } else if (role === "profesor") {
    configurarSubidaArchivos(token);
    await cargarArchivosPropios(token);
  }
});

// ============= FUNCIONES =============

// 🧑‍🏫 Cargar lista de profesores
async function cargarProfesores(token) {
  const select = document.getElementById("profesorSelect");
  const lista = document.getElementById("documentList");

  try {
    const res = await fetch("/api/profesores", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profesores = await res.json();

    select.innerHTML = `<option value="">Selecciona un profesor</option>`;
    profesores.forEach((prof) => {
      const option = document.createElement("option");
      option.value = prof._id;
      option.textContent = prof.name;
      select.appendChild(option);
    });

    select.addEventListener("change", async () => {
      const id = select.value;
      lista.innerHTML = "";
      if (id) await cargarArchivosProfesor(id, token);
    });
  } catch (err) {
    console.error("Error al cargar profesores:", err);
    select.innerHTML = `<option>Error al obtener profesores</option>`;
  }
}

// 📂 Cargar archivos de un profesor
async function cargarArchivosProfesor(profesorId, token) {
  const lista = document.getElementById("documentList");
  lista.innerHTML = "<li>Cargando archivos...</li>";

  try {
    const res = await fetch(`/api/documentos/${profesorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const documentos = await res.json();

    if (documentos.length === 0) {
      lista.innerHTML = "<li>No hay archivos disponibles.</li>";
      return;
    }

    lista.innerHTML = "";
    documentos.forEach((doc) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${doc.nombre}</strong><br/>
        <a href="${doc.url}" target="_blank">📂 Ver archivo</a>
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    console.error("Error al cargar archivos:", err);
    lista.innerHTML = "<li>Error al obtener archivos.</li>";
  }
}

// 📄 Cargar archivos propios (profesor)
async function cargarArchivosPropios(token) {
  const lista = document.getElementById("documentList");
  lista.innerHTML = "<li>Cargando tus archivos...</li>";

  try {
    const res = await fetch("/api/documentos/mios", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const documentos = await res.json();

    if (documentos.length === 0) {
      lista.innerHTML = "<li>No has subido ningún archivo.</li>";
      return;
    }

    lista.innerHTML = "";
    documentos.forEach((doc) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${doc.nombre}</strong><br/>
        <a href="${doc.url}" target="_blank">📂 Ver archivo</a>
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    console.error("Error al cargar tus archivos:", err);
    lista.innerHTML = "<li>Error al obtener tus archivos.</li>";
  }
}

// ⬆️ Subir archivo
function configurarSubidaArchivos(token) {
  const form = document.getElementById("uploadForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files.length) {
      alert("Selecciona un archivo.");
      return;
    }

    const formData = new FormData();
    formData.append("document", fileInput.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        alert("Archivo subido correctamente.");
        fileInput.value = "";
        await cargarArchivosPropios(token);
      } else {
        alert("Error al subir archivo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al subir archivo.");
    }
  });
}
