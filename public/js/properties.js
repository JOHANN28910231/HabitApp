// properties.js — manejador de la interfaz de propiedades

// Obtener hostId del sessionStorage (configurado al hacer login)
window.hostId = sessionStorage.getItem('host_id') || sessionStorage.getItem('user_id') || 2;
console.log('🔑 Host ID cargado:', window.hostId);

let propiedadSeleccionada = null;

const API = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {

    const modal = new bootstrap.Modal(document.getElementById("modalPropiedad"));
    const formPropiedad = document.getElementById("formPropiedad");

    // Cargar propiedades al iniciar
    loadProperties();

    // Abrir modal para crear propiedad
    document.getElementById("btnAbrirCrear").addEventListener("click", () => {
        propiedadSeleccionada = null;
        formPropiedad.reset();
        document.getElementById("id_propiedad").value = "";
        document.querySelector("#modalPropiedad h2").innerText = "Añadir propiedad";
        // Limpiar el archivo de foto
        document.getElementById("foto_propiedad").value = "";
        // poner fecha_registro hoy por defecto
        const today = new Date().toISOString().slice(0, 10);
        const fechaInput = document.getElementById('fecha_registro');
        if (fechaInput) fechaInput.value = today;
        // estado por defecto
        const estadoInput = document.getElementById('estado_propiedad');
        if (estadoInput) estadoInput.value = 'activa';
        modal.show();
    });

    // Abrir modal para editar propiedad
    document.getElementById("btnEditar").addEventListener("click", () => {
        if (!propiedadSeleccionada) return alert("Selecciona una propiedad primero");

        document.querySelector("#modalPropiedad h2").innerText = "Editar propiedad";

        document.getElementById("nombre_propiedad").value = propiedadSeleccionada.nombre_propiedad;
        document.getElementById("tipo_propiedad").value = propiedadSeleccionada.tipo_propiedad;
        document.getElementById("direccion").value = propiedadSeleccionada.direccion;
        document.getElementById("codigo_postal").value = propiedadSeleccionada.codigo_postal;
        document.getElementById("municipio").value = propiedadSeleccionada.municipio;
        document.getElementById("estado").value = propiedadSeleccionada.estado;
        document.getElementById("ubicacion_url").value = propiedadSeleccionada.ubicacion_url;
        document.getElementById("descripcion").value = propiedadSeleccionada.descripcion;
        document.getElementById("politicas_hospedaje").value = propiedadSeleccionada.politicas_hospedaje || '';
        document.getElementById("servicios_generales").value = propiedadSeleccionada.servicios_generales || '';
        if (propiedadSeleccionada.fecha_registro) document.getElementById("fecha_registro").value = propiedadSeleccionada.fecha_registro.substring(0, 10);
        document.getElementById("estado_propiedad").value = propiedadSeleccionada.estado_propiedad || 'activa';

        document.getElementById("id_propiedad").value = propiedadSeleccionada.id_propiedad;

        modal.show();
    });

    // Guardar (crear o editar) propiedad
    formPropiedad.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = formPropiedad.querySelector("button[type='submit']");
        const idPropiedad = document.getElementById("id_propiedad").value;
        const formData = new FormData(formPropiedad);

        // Agregar el id_anfitrion al FormData
        formData.append("id_anfitrion", window.hostId);

        // Si no se proporcionó fecha_registro, establecer hoy
        if (!formData.get('fecha_registro') || formData.get('fecha_registro') === '') {
            const today = new Date().toISOString().slice(0, 10);
            formData.set('fecha_registro', today);
        }

        let url = `${API}/api/properties`;
        let method = "POST";

        if (idPropiedad) {
            url = `${API}/api/properties/${idPropiedad}`;
            method = "PUT";
        }

        // Deshabilitar botón
        submitBtn.disabled = true;
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Guardando...";

        try {
            console.log("📤 Enviando solicitud:", { method, url });

            const response = await fetch(url, {
                method,
                credentials: 'include',
                body: formData
            });

            console.log("📥 Status:", response.status);
            console.log("📥 Content-Type:", response.headers.get('content-type'));

            // Verificar si la respuesta es JSON válida
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error("❌ Respuesta no es JSON:", text.substring(0, 200));
                alert("❌ Error del servidor: La respuesta no es válida. Revisa la consola del servidor.");
                return;
            }

            console.log("📥 Respuesta del servidor:", data);

            if (response.ok) {
                alert("✅ ¡Propiedad guardada correctamente!");
                modal.hide();
                formPropiedad.reset();
                document.getElementById("id_propiedad").value = "";
                loadProperties();
            } else {
                console.error("❌ Error:", data);

                if (response.status === 401) {
                    alert("No autorizado. Por favor inicia sesión como anfitrión.");
                    window.location.href = '/login';
                    return;
                }
                if (response.status === 403) {
                    alert("Prohibido: no tienes permisos de anfitrión para gestionar propiedades.");
                    return;
                }

                alert("❌ Error: " + (data.error || data.message || "Error desconocido"));
            }

        } catch (err) {
            console.error("❌ Error de conexión:", err);
            alert("❌ Error de conexión: " + err.message);
        } finally {
            // Reactivar botón
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    // Eliminar propiedad seleccionada
    document.getElementById("btnEliminar").addEventListener("click", async () => {
        if (!propiedadSeleccionada) return alert("Selecciona una propiedad primero");

        if (!confirm(`¿Eliminar la propiedad "${propiedadSeleccionada.nombre_propiedad}"?`)) return;

        const res = await fetch(`${API}/api/properties/${propiedadSeleccionada.id_propiedad}`, {
            method: "DELETE",
            credentials: 'include'
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));

            if (res.status === 401) {
                alert("No autorizado. Inicia sesión como anfitrión.");
                window.location.href = '/login';
                return;
            }
            if (res.status === 403) {
                alert("Prohibido: no tienes permisos de anfitrión para eliminar propiedades.");
                return;
            }

            return alert("Error al eliminar propiedad");
        }

        propiedadSeleccionada = null;
        loadProperties();
        document.getElementById("roomsContainer").innerHTML = "";
    });

    // Acceso a la gestión de habitaciones de la propiedad
    document.getElementById("btnAdministrarHabitaciones").addEventListener("click", () => {
        if (!propiedadSeleccionada) return alert("Selecciona una propiedad primero");

        // Guardar el ID de la propiedad en sessionStorage para usarlo en rooms.html
        sessionStorage.setItem('propiedad_id', propiedadSeleccionada.id_propiedad);
        sessionStorage.setItem('propiedad_nombre', propiedadSeleccionada.nombre_propiedad);

        // Redirigir a rooms.html
        window.location.href = '/host/rooms.html';
    });

});

// Cargar propiedades
async function loadProperties() {
    const container = document.getElementById("propertiesContainer");
    container.innerHTML = "<p>Cargando propiedades...</p>";

    try {
        const res = await fetch(`${API}/api/properties/host/${window.hostId}`, {
            credentials: 'include'
        });

        if (!res.ok) {
            if (res.status === 401) {
                alert("No autorizado. Por favor inicia sesión como anfitrión.");
                window.location.href = '/login';
                return;
            }
            if (res.status === 403) {
                alert("Prohibido: no tienes permisos de anfitrión.");
                return;
            }
            throw new Error('Error al cargar propiedades');
        }

        const propiedades = await res.json();

        if (propiedades.length === 0) {
            container.innerHTML = "<p class='text-muted'>No tienes propiedades registradas.</p>";
            return;
        }

        let html = "";

        propiedades.forEach(p => {

            const foto = p.url_fotos_p
                ? `/fotosPropiedades/${p.url_fotos_p}`
                : "/fotosPropiedades/placeholder.jpg";

            const direccionCompleta = p.direccion || 'No especificada';
            const descripcion = p.descripcion || 'Sin descripción';
            const politicas = p.politicas_hospedaje || 'No especificadas';
            const servicios = p.servicios_generales || 'No especificados';
            const fechaRegistro = p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-MX') : 'N/A';
            const estado = p.estado_propiedad || 'activa';

            html += `
        <div class="card mb-3 shadow-sm propiedad-item"
             data-info='${JSON.stringify(p).replace(/'/g, "&apos;")}'
             style="cursor:pointer;">
          <div class="row g-0">

            <div class="col-md-4">
              <img src="${foto}"
                   class="img-fluid rounded-start"
                   style="height: 100%; width: 100%; object-fit: cover;">
            </div>

            <div class="col-md-8 p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="fw-bold mb-0">${p.nombre_propiedad}</h5>
                <span class="badge bg-${estado === 'activa' ? 'success' : 'secondary'}">${estado}</span>
              </div>
              
              <p class="mb-1"><strong>Tipo:</strong> ${p.tipo_propiedad}</p>
              <p class="mb-1"><strong>Ubicación:</strong> ${p.municipio}, ${p.estado}</p>
              <p class="mb-1"><strong>Dirección:</strong> ${direccionCompleta}</p>
              
              <p class="mb-1 small text-muted"><strong>Descripción:</strong> ${descripcion.substring(0, 100)}${descripcion.length > 100 ? '...' : ''}</p>
              
              <p class="mb-1 small"><strong>Políticas:</strong> ${politicas.substring(0, 80)}${politicas.length > 80 ? '...' : ''}</p>
              <p class="mb-1 small"><strong>Servicios:</strong> ${servicios.substring(0, 80)}${servicios.length > 80 ? '...' : ''}</p>
              
              <p class="mb-0 small text-muted"><strong>Registrada:</strong> ${fechaRegistro}</p>
            </div>
          </div>
        </div>
      `;
        });

        container.innerHTML = html;
        activarClicksPropiedades();

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p class='text-danger'>Error al cargar propiedades.</p>";
    }
}

// Seleccionar propiedad
function activarClicksPropiedades() {
    const botones = document.querySelectorAll(".propiedad-item");

    botones.forEach(btn => {
        btn.addEventListener("click", () => {
            botones.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            propiedadSeleccionada = JSON.parse(btn.getAttribute("data-info"));

            loadRooms(propiedadSeleccionada.id_propiedad, propiedadSeleccionada.nombre_propiedad);
        });
    });
}

// Cargar habitaciones de una propiedad
async function loadRooms(id, nombre) {
    const container = document.getElementById("roomsContainer");
    container.innerHTML = "<p>Cargando habitaciones...</p>";

    try {
        const res = await fetch(`${API}/api/properties/${id}/habitaciones`, {
            credentials: 'include'
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                container.innerHTML = "<p class='text-danger'>No autorizado para ver habitaciones.</p>";
                return;
            }
            throw new Error('Error al cargar habitaciones');
        }

        const rooms = await res.json();

        if (rooms.length === 0) {
            container.innerHTML =
                `<p class='text-muted'>La propiedad <strong>${nombre}</strong> no tiene habitaciones.</p>`;
            return;
        }

        let html = `
      <h4 class="fw-bold mb-3">
        Habitaciones de <span class="text-primary">${nombre}</span>
      </h4>
      <div class="list-group">
    `;

        rooms.forEach((r, index) => {
            const numeroHabitacion = index + 1; // Número consecutivo
            const capacidad = r.capacidad_maxima || 'No especificado';
            const precioNoche = r.precio_por_noche ? `$${r.precio_por_noche}` : 'No especificado';
            const descripcion = r.descripcion || 'Sin descripción';

            html += `
        <div class="list-group-item">
          <strong>Habitación #${numeroHabitacion}</strong><br>
          ${descripcion}<br>
          Capacidad: ${capacidad}<br>
          Precio por noche: ${precioNoche}
        </div>`;
        });

        html += "</div>";
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p class='text-danger'>Error al cargar habitaciones.</p>";
    }
}
