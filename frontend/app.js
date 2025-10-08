document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("userName");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userName").textContent = userName || "Usuario";

  if (role === "director") {
    mostrarVistaDirector(token);
  } else if (role === "teacher") {
    mostrarVistaProfesor(token);
  }
});

// ========================
// VISTA DIRECTOR
// ========================
async function mostrarVistaDirector(token) {
  const contenedor = document.getElementById("mainContent");
  contenedor.innerHTML = `
    <h2>Profesores</h2>
    <div id="profesoresContainer" class="profesores-grid"></div>
    <div id="archivosProfesor" class="archivos-lista"></div>
  `;

  try {
    const res = await fetch("/api/auth/teachers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profesores = await res.json();

    const cont = document.getElementById("profesoresContainer");
    cont.innerHTML = "";

    profesores.forEach((prof) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <div class="card-header">👨‍🏫 ${prof.name}</div>
        <div class="card-body">
          <p>${prof.email}</p>
          <button class="btn-ver" data-id="${prof.id}">Ver archivos</button>
        </div>
      `;
      cont.appendChild(card);
    });

    document.querySelectorAll(".btn-ver").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        cargarArchivosProfesor(id, token);
      })
    );
  } catch (err) {
    console.error("Error al cargar profesores:", err);
  }
}

// ========================
// VISTA PROFESOR
// ========================
function mostrarVistaProfesor(token) {
  const contenedor = document.getElementById("mainContent");
  contenedor.innerHTML = `
    <div class="upload-section">
      <h2>Subir archivo</h2>
      <form id="uploadForm" class="upload-form">
        <input type="file" id="fileInput" required />
        <button type="submit" class="btn-subir">Subir</button>
      </form>
    </div>
    <h2>Mis archivos</h2>
    <div id="documentList" class="archivos-lista"></div>
  `;

  configurarSubidaArchivos(token);
  cargarMisArchivos(token);
}

// ========================
// FUNCIONES DE ARCHIVOS
// ========================
function configurarSubidaArchivos(token) {
  const form = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("document", fileInput.files[0]);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir el archivo");

      alert("✅ Archivo subido correctamente");
      fileInput.value = "";
      cargarMisArchivos(token);
    } catch (err) {
      alert("❌ Error al subir el archivo");
      console.error(err);
    }
  });
}

async function cargarMisArchivos(token) {
  const lista = document.getElementById("documentList");
  lista.innerHTML = "<p>Cargando...</p>";

  try {
    const res = await fetch("/api/documents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const documentos = await res.json();

    if (documentos.length === 0) {
      lista.innerHTML = "<p>No tienes archivos subidos.</p>";
      return;
    }

    lista.innerHTML = "";
    documentos.forEach((doc) => {
      const div = document.createElement("div");
      div.classList.add("archivo-card");
      div.innerHTML = `
        <strong>${doc.title}</strong><br>
        <a href="${doc.filepath}" target="_blank">📄 Ver archivo</a>
      `;
      lista.appendChild(div);
    });
  } catch (err) {
    console.error("Error al cargar archivos:", err);
  }
}

async function cargarArchivosProfesor(id, token) {
  const contenedor = document.getElementById("archivosProfesor");
  contenedor.innerHTML = "<p>Cargando archivos...</p>";

  try {
    const res = await fetch(`/api/documents/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const documentos = await res.json();

    contenedor.innerHTML = `
      <h3>Archivos del profesor seleccionado</h3>
      ${
        documentos.length === 0
          ? "<p>No hay archivos disponibles.</p>"
          : documentos
              .map(
                (d) =>
                  `<div class="archivo-card"><strong>${d.title}</strong><br><a href="${d.filepath}" target="_blank">📂 Ver archivo</a></div>`
              )
              .join("")
      }
    `;
  } catch (err) {
    console.error("Error al cargar archivos del profesor:", err);
  }
}
