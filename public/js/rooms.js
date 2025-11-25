// rooms.js — manejador de la interfaz de habitaciones

// Obtener hostId del sessionStorage (configurado al hacer login)
window.hostId = sessionStorage.getItem('host_id') || sessionStorage.getItem('user_id') || 2;
console.log('🔑 Host ID cargado:', window.hostId);

let propiedadSeleccionada = null;
let serviciosCatalog = null;
let pendingBlocks = []; // bloqueos añadidos en el modal pero aún no guardados
let existingBlocks = []; // bloqueos que ya existen en la DB para la habitación editada

const API = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  initRoomsUI();
});

function qs(id) { return document.getElementById(id); }

async function initRoomsUI() {
  const propertySelect = qs('propertySelect');
  const btnAbrirCrearRoom = qs('btnAbrirCrearRoom');

  await loadPropertiesIntoSelect();

  propertySelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) {
      btnAbrirCrearRoom.disabled = true;
      qs('propertyTitle').innerText = 'Habitaciones';
      qs('roomsList').innerHTML = '';
      qs('roomsEmptyState').classList.remove('d-none');
      return;
    }

    btnAbrirCrearRoom.disabled = false;
    const name = propertySelect.selectedOptions[0].dataset.nombre || propertySelect.selectedOptions[0].text;
    qs('propertyTitle').innerText = `Habitaciones — ${name}`;
    loadRooms(val, name);
  });

  btnAbrirCrearRoom.addEventListener('click', async () => {
    openRoomModalForCreate();
  });

  // Confirmar eliminación
  qs('confirmDeleteRoomBtn').addEventListener('click', async () => {
    const id = qs('id_habitacion_delete').value;
    if (!id) return;
    try {
      const res = await fetch(`${API}/api/rooms/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
          alert('No autorizado. Inicia sesión como anfitrión para eliminar habitaciones.');
          window.location.href = '/login';
          return;
        }
        if (res.status === 403) {
          alert('Prohibido: no tienes permisos de anfitrión para eliminar habitaciones.');
          return;
        }

        alert('Error al eliminar: ' + (data.error || res.statusText));
        return;
      }
      const propId = qs('propertySelect').value;
      const propName = qs('propertySelect').selectedOptions[0]?.dataset?.nombre || '';
      loadRooms(propId, propName);
      const modal = bootstrap.Modal.getInstance(qs('modalConfirmDeleteRoom'));
      modal.hide();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar habitación');
    }
  });

  // Guardar habitación desde el modal
  qs('formRoom').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveRoomFromModal();
  });

  // Botón para añadir bloqueos (mantenimiento)
  const btnAddBlock = qs('btnAddBlock');
  if (btnAddBlock) {
    btnAddBlock.addEventListener('click', () => {
      const start = qs('blockStart').value;
      const end = qs('blockEnd').value;
      const motivo = qs('blockReason').value || '';

      if (!start || !end) {
        alert('Por favor selecciona fecha de inicio y fecha fin.');
        return;
      }
      if (end <= start) {
        alert('La fecha fin debe ser posterior a la fecha inicio.');
        return;
      }

      // añadir al array de pendientes
      pendingBlocks.push({ fecha_inicio: start, fecha_fin: end, motivo });
      renderBlocksList();

      // limpiar campos
      qs('blockStart').value = '';
      qs('blockEnd').value = '';
      qs('blockReason').value = '';
    });
  }

  // Cargar catálogo de servicios
  await loadServicesCatalog();
}

async function loadServicesCatalog() {
  try {
    const res = await fetch(`${API}/api/rooms/services`, { credentials: 'include' });
    if (!res.ok) throw new Error('No services');
    serviciosCatalog = await res.json();
    renderServicesCheckboxes();
  } catch (err) {
    console.warn('No se pudieron cargar servicios:', err);
    // Fallback: usar lista mínima conocida (las que solicitaste)
    serviciosCatalog = [
      { id_servicio: -1, nombre: 'Aire Acondicionado' },
      { id_servicio: -2, nombre: 'Ventilador' },
      { id_servicio: -3, nombre: 'Cama' },
      { id_servicio: -4, nombre: 'Televisión' },
      { id_servicio: -5, nombre: 'Vajilla' },
      { id_servicio: -6, nombre: 'Refrigerador' },
      { id_servicio: -7, nombre: 'Estufa' }
    ];
    renderServicesCheckboxes();
  }
}

function renderServicesCheckboxes() {
  const container = qs('servicesContainer');
  if (!container) return;
  container.innerHTML = '';
  serviciosCatalog.forEach(s => {
    const id = `svc_${s.id_servicio}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'form-check';
    wrapper.innerHTML = `<input class="form-check-input" type="checkbox" value="${s.id_servicio}" id="${id}">
      <label class="form-check-label small" for="${id}">${s.nombre}</label>`;
    container.appendChild(wrapper);
  });
}

function renderBlocksList() {
  const container = qs('blocksList');
  if (!container) return;
  container.innerHTML = '';

  // mostrar bloqueos existentes (desde DB)
  if (existingBlocks && existingBlocks.length > 0) {
    existingBlocks.forEach(b => {
      const item = document.createElement('div');
      item.className = 'list-group-item';
      const inicio = b.fecha_inicio ? new Date(b.fecha_inicio).toLocaleDateString() : b.fecha_inicio;
      const fin = b.fecha_fin ? new Date(b.fecha_fin).toLocaleDateString() : b.fecha_fin;
      item.innerHTML = `<div><strong>Existente:</strong> ${inicio} → ${fin} ${b.motivo ? ('— ' + b.motivo) : ''}</div>`;
      container.appendChild(item);
    });
  }

  // mostrar bloqueos pendientes (a guardar)
  if (pendingBlocks && pendingBlocks.length > 0) {
    pendingBlocks.forEach((b, idx) => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-start';
      const inicio = b.fecha_inicio ? new Date(b.fecha_inicio).toLocaleDateString() : b.fecha_inicio;
      const fin = b.fecha_fin ? new Date(b.fecha_fin).toLocaleDateString() : b.fecha_fin;
      item.innerHTML = `<div><strong>Pendiente:</strong> ${inicio} → ${fin} ${b.motivo ? ('— ' + b.motivo) : ''}</div>
        <div><button class="btn btn-sm btn-outline-danger" data-idx="${idx}">Quitar</button></div>`;
      container.appendChild(item);
    });

    // attach remove handlers
    container.querySelectorAll('button[data-idx]').forEach(btn => btn.addEventListener('click', (e) => {
      const i = Number(e.currentTarget.dataset.idx);
      if (!isNaN(i)) {
        pendingBlocks.splice(i, 1);
        renderBlocksList();
      }
    }));
  }

  if ((!(existingBlocks && existingBlocks.length) && !(pendingBlocks && pendingBlocks.length))) {
    container.innerHTML = '<div class="list-group-item text-muted">No hay bloqueos añadidos.</div>';
  }
}

async function loadPropertiesIntoSelect() {
  const select = qs('propertySelect');
  select.innerHTML = '<option value="">-- Elige una propiedad --</option>';

  try {
    const res = await fetch(`${API}/api/properties/host/${window.hostId}`, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) {
        // no autenticado
        console.warn('No autenticado al cargar propiedades');
        return;
      }
      if (res.status === 403) {
        console.warn('Sin permisos para cargar propiedades');
        return;
      }
    }
    const props = await res.json();

    props.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id_propiedad;
      opt.text = p.nombre_propiedad;
      opt.dataset.nombre = p.nombre_propiedad;
      select.appendChild(opt);
    });

    // Verificar si hay una propiedad preseleccionada en sessionStorage
    const propiedadPreseleccionada = sessionStorage.getItem('propiedad_id');
    const nombrePreseleccionado = sessionStorage.getItem('propiedad_nombre');

    if (propiedadPreseleccionada) {
      console.log('🔍 Propiedad preseleccionada:', propiedadPreseleccionada, nombrePreseleccionado);
      // Intentar seleccionar explícitamente la opción correspondiente
      let matchedOption = Array.from(select.options).find(o => String(o.value) === String(propiedadPreseleccionada));
      if (matchedOption) {
        matchedOption.selected = true;
        select.value = matchedOption.value;
        select.selectedIndex = Array.from(select.options).indexOf(matchedOption);
      } else {
        // Si no se encuentra, intentar setear por valor igual (coerción)
        select.value = propiedadPreseleccionada;
        // Si aún no hay coincidencia, creamos una opción temporal con el nombre (si está disponible)
        if (!Array.from(select.options).some(o => String(o.value) === String(propiedadPreseleccionada))) {
          const tempOpt = document.createElement('option');
          tempOpt.value = propiedadPreseleccionada;
          tempOpt.text = nombrePreseleccionado || `Propiedad ${propiedadPreseleccionada}`;
          tempOpt.dataset.nombre = nombrePreseleccionado || '';
          tempOpt.selected = true;
          // Insertar al inicio después del placeholder
          if (select.options.length > 0) select.add(tempOpt, select.options[1] || null);
          else select.appendChild(tempOpt);
          console.warn('Se creó una opción temporal para la propiedad preseleccionada:', propiedadPreseleccionada);
        }
      }

      // Habilitar botón de añadir
      qs('btnAbrirCrearRoom').disabled = false;

      // Actualizar el título usando el nombre de sessionStorage o la opción seleccionada
      const nombre = nombrePreseleccionado || (select.selectedOptions[0]?.text) || 'Propiedad';
      qs('propertyTitle').innerText = `Habitaciones — ${nombre}`;

      // Forzar evento change para sincronizar la UI
      try {
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) { /* no bloquear si falla */ }

      // Cargar las habitaciones directamente (en caso el evento no funcione)
      loadRooms(propiedadPreseleccionada, nombre);
    }
  } catch (err) {
    console.error('Error loading properties', err);
  }
}

// Cargar habitaciones de una propiedad
async function loadRooms(id_propiedad, nombre) {
  const container = qs('roomsList');
  container.innerHTML = '<p>Cargando habitaciones...</p>';
  qs('roomsEmptyState').classList.add('d-none');

  console.log('🔍 Cargando habitaciones para propiedad:', id_propiedad, nombre);

  try {
    const url = `${API}/api/properties/${id_propiedad}/habitaciones`;
    console.log('📡 Fetching:', url);

    const res = await fetch(url, { credentials: 'include' });
    console.log('📥 Response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Error response:', errorText);
      throw new Error('Error cargando habitaciones: ' + res.status);
    }

    const rooms = await res.json();
    console.log('✅ Habitaciones recibidas:', rooms);

    if (!Array.isArray(rooms) || rooms.length === 0) {
      console.log('ℹ️ No hay habitaciones para esta propiedad');
      container.innerHTML = '';
      qs('roomsEmptyState').classList.remove('d-none');
      return;
    }

    // For each room, fetch details
    const detailed = await Promise.all(rooms.map(async (r) => {
      try {
        const dres = await fetch(`${API}/api/rooms/${r.id_habitacion}`, { credentials: 'include' });
        if (!dres.ok) return r;
        return await dres.json();
      } catch (err) {
        console.warn('Error cargando detalles de habitación:', r.id_habitacion, err);
        return r;
      }
    }));

    console.log('✅ Habitaciones con detalles:', detailed);

    let html = '';
    detailed.forEach((r, index) => {
      const numeroHabitacion = index + 1; // Número consecutivo basado en la posición
      const fotos = Array.isArray(r.fotos) ? r.fotos : [];

      let fotoHtml;
      if (fotos.length > 0) {
        fotoHtml = fotos.map(f => {
          const src = (f.url && f.url.startsWith('http')) ? f.url : `/fotosHabitaciones/${f.url}`;
          return `<img src="${src}" onerror="this.src='/fotosPropiedades/placeholder.jpg'" class="img-fluid rounded mb-2" style="height:160px; width:100%; object-fit:cover;">`;
        }).join('');
      } else {
        fotoHtml = `<img src="/fotosPropiedades/placeholder.jpg" class="img-fluid rounded mb-2" style="height:160px; width:100%; object-fit:cover;" alt="Sin fotos">`;
      }

      const serviciosHtml = (r.servicios || []).map(s => `<span class="badge bg-secondary me-1 small">${s.nombre}</span>`).join(' ');
      const bloqueos = Array.isArray(r.bloqueos) ? r.bloqueos : [];
      let bloqueosHtml = '';
      if (bloqueos.length > 0) {
        bloqueosHtml = `<div class="mt-2 small text-muted"><strong>Bloqueos:</strong> ` + bloqueos.map(b => {
          const inicio = b.fecha_inicio ? new Date(b.fecha_inicio).toLocaleDateString() : b.fecha_inicio;
          const fin = b.fecha_fin ? new Date(b.fecha_fin).toLocaleDateString() : b.fecha_fin;
          return `${inicio} → ${fin}${b.motivo ? (' (' + b.motivo + ')') : ''}`;
        }).join('; ') + `</div>`;
      }

      html += `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <div class="mb-2">${fotoHtml}</div>
              <h6 class="card-title">Habitación #${numeroHabitacion}</h6>
              <p class="card-text small">${r.descripcion || ''}</p>
              <ul class="list-unstyled small mb-2">
                <li>Capacidad: ${r.capacidad_maxima || 'N/A'}</li>
                <li>Precio noche: $${r.precio_por_noche || '0'}</li>
                <li>Precio semana: $${r.precio_por_semana || '0'}</li>
                <li>Precio mes: $${r.precio_por_mes || '0'}</li>
                <li>Estado: ${r.estado_habitacion || r.estado || 'N/A'}</li>
              </ul>
              <div class="mb-2">${serviciosHtml}</div>
              ${bloqueosHtml}
              <div class="mt-auto d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary btn-edit-room" data-id="${r.id_habitacion}">Editar</button>
                <button class="btn btn-sm btn-outline-danger btn-delete-room" data-id="${r.id_habitacion}">Eliminar</button>
              </div>
            </div>
          </div>
        </div>`;
    });

    container.innerHTML = html;

    // attach handlers
    document.querySelectorAll('.btn-delete-room').forEach(b => b.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      qs('id_habitacion_delete').value = id;
      const modal = new bootstrap.Modal(qs('modalConfirmDeleteRoom'));
      modal.show();
    }));

    document.querySelectorAll('.btn-edit-room').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      console.log('🔧 Editando habitación ID:', id);
      try {
        const url = `${API}/api/rooms/${id}`;
        console.log('📡 Fetching room details:', url);

        const res = await fetch(url);
        console.log('📥 Response status:', res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Error response:', errorText);
          throw new Error('Error cargando detalles: ' + res.status);
        }

        const room = await res.json();
        console.log('✅ Room details:', room);

        openRoomModalForEdit(room);
      } catch (err) {
        console.error('❌ Error completo:', err);
        alert('No se pudo cargar la habitación: ' + err.message);
      }
    }));

  } catch (err) {
    console.error('❌ Error completo:', err);
    container.innerHTML = `<p class="text-danger">Error al cargar habitaciones: ${err.message}</p>`;
  }
}

function openRoomModalForCreate() {
  const modalEl = qs('modalRoom');
  const modal = new bootstrap.Modal(modalEl);
  qs('modalRoomTitle').innerText = 'Crear habitación';
  qs('id_habitacion').value = '';
  qs('id_propiedad_hidden').value = qs('propertySelect').value;
  qs('descripcion').value = '';
  qs('capacidad').value = '';
  qs('precioNoche').value = '';
  qs('precioSemana').value = '';
  qs('precioMes').value = '';
  qs('estado_habitacion').value = 'activa';
  qs('roomPhotos').value = '';
  serviciosCatalog && serviciosCatalog.forEach(s => {
    const cb = qs(`svc_${s.id_servicio}`);
    if (cb) cb.checked = false;
  });
  // limpiar bloqueos pendientes/visuales
  pendingBlocks = [];
  existingBlocks = [];
  renderBlocksList();
  modal.show();
}

function openRoomModalForEdit(room) {
  const modalEl = qs('modalRoom');
  const modal = new bootstrap.Modal(modalEl);

  // Obtener el número consecutivo de la habitación
  const propId = qs('propertySelect').value;
  // No podemos saber fácilmente el número sin recargar, así que usamos el ID de la DB
  qs('modalRoomTitle').innerText = `Editar habitación`;

  qs('id_habitacion').value = room.id_habitacion;
  qs('id_propiedad_hidden').value = room.id_propiedad || qs('propertySelect').value;
  qs('descripcion').value = room.descripcion || '';
  qs('capacidad').value = room.capacidad_maxima || '';
  qs('precioNoche').value = room.precio_por_noche || '';
  qs('precioSemana').value = room.precio_por_semana || '';
  qs('precioMes').value = room.precio_por_mes || '';
  qs('estado_habitacion').value = room.estado_habitacion || 'activa';
  serviciosCatalog && serviciosCatalog.forEach(s => {
    const cb = qs(`svc_${s.id_servicio}`);
    if (cb) cb.checked = (room.servicios || []).some(x => x.id_servicio == s.id_servicio);
  });
  qs('roomPhotos').value = '';
  // cargar bloqueos existentes
  existingBlocks = Array.isArray(room.bloqueos) ? room.bloqueos : [];
  pendingBlocks = [];
  renderBlocksList();
  modal.show();
}

async function saveRoomFromModal() {
  const id = qs('id_habitacion').value;
  const id_propiedad = qs('id_propiedad_hidden').value;
  const payload = {
    id_propiedad,
    descripcion: qs('descripcion').value,
    capacidad_maxima: qs('capacidad').value || null,
    precio_por_noche: qs('precioNoche').value || null,
    precio_por_semana: qs('precioSemana').value || null,
    precio_por_mes: qs('precioMes').value || null,
    estado_habitacion: qs('estado_habitacion').value
  };

  try {
    let res;
    if (id) {
      res = await fetch(`${API}/api/rooms/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // validar id_propiedad antes de crear
      if (!payload.id_propiedad || payload.id_propiedad.length === 0) {
        // intentar leer del select
        const fallback = qs('propertySelect')?.value;
        if (fallback) payload.id_propiedad = fallback;
      }

      if (!payload.id_propiedad || payload.id_propiedad.length === 0) {
        alert('Falta propiedad seleccionada. Selecciona una propiedad antes de crear la habitación.');
        return;
      }

      res = await fetch(`${API}/api/rooms`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      let errBody = null;
      try { errBody = await res.json(); } catch (e) { errBody = { message: await res.text().catch(() => '') }; }
      const msg = errBody && (errBody.error || errBody.message) ? (errBody.error || errBody.message) : res.statusText;

      if (res.status === 401) {
        alert('No autorizado. Por favor inicia sesión como anfitrión para guardar habitaciones.');
        window.location.href = '/login';
        return;
      }
      if (res.status === 403) {
        alert('Prohibido: no tienes permisos de anfitrión para gestionar habitaciones.');
        return;
      }

      alert('Error guardando habitación (' + res.status + '): ' + msg);
      return;
    }

    const data = await res.json().catch(() => ({}));
    const roomId = id || data.id_habitacion || data.id || data.insertId;

    // Upload photos if any
    const files = qs('roomPhotos').files;
    if (files && files.length > 0) {
      const form = new FormData();
      for (const f of files) form.append('photos', f);
      const up = await fetch(`${API}/api/rooms/${roomId}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: form
      });
      if (!up.ok) console.warn('Warning uploading photos');
    }

    // Save services
    const checked = Array.from(document.querySelectorAll('#servicesContainer input[type=checkbox]:checked')).map(i => Number(i.value));
    if (checked.length > 0) {
      const svcRes = await fetch(`${API}/api/rooms/${roomId}/services`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicios: checked })
      });
      if (!svcRes.ok) {
        let errBody = null;
        try { errBody = await svcRes.json(); } catch (e) { errBody = { message: await svcRes.text().catch(() => '') }; }
        const msg = errBody && (errBody.error || errBody.message) ? (errBody.error || errBody.message) : svcRes.statusText;
        console.warn('Warning saving services:', svcRes.status, msg);
      }
    }

    // close modal and reload
    // Guardar bloqueos pendientes (si hay)
    if (pendingBlocks && pendingBlocks.length > 0) {
      try {
        for (const b of pendingBlocks) {
          const blkRes = await fetch(`${API}/api/rooms/${roomId}/blocks`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(b)
          });
          if (!blkRes.ok) console.warn('Warning saving block', await blkRes.text());
        }
      } catch (err) {
        console.error('Error guardando bloqueos:', err);
      }
    }

    const modal = bootstrap.Modal.getInstance(qs('modalRoom'));
    modal.hide();
    const propId = qs('propertySelect').value;
    const propName = qs('propertySelect').selectedOptions[0]?.dataset?.nombre || '';
    loadRooms(propId, propName);

  } catch (err) {
    console.error(err);
    alert('Error guardando habitación');
  }
}



