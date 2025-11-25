// ============================================================
// rooms.js — HOST DE PRUEBA
// ============================================================

window.hostId = 2; // Host de prueba
let propiedadSeleccionada = null;
let serviciosCatalog = null;

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

  // delete confirm
  qs('confirmDeleteRoomBtn').addEventListener('click', async () => {
    const id = qs('id_habitacion_delete').value;
    if (!id) return;
    try {
      const res = await fetch(`${API}/api/rooms/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          alert('No autorizado. Inicia sesión como anfitrión para eliminar habitaciones.');
          window.location.href = '/login';
          return;
        }
        if (res.status === 403) {
          alert('Prohibido: no tienes permisos de anfitrión para eliminar esta habitación.');
          return;
        }
        alert('Error al eliminar: ' + (data.error || res.statusText));
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

  // save room form
  qs('formRoom').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveRoomFromModal();
  });

  // load services catalog once
  await loadServicesCatalog();
}

async function loadServicesCatalog() {
  try {
    const res = await fetch(`${API}/api/rooms/services`);
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

async function loadPropertiesIntoSelect() {
  const select = qs('propertySelect');
  select.innerHTML = '<option value="">-- Elige una propiedad --</option>';
  try {
    const res = await fetch(`${API}/api/properties/host/${window.hostId}`);
    const props = await res.json();
    props.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id_propiedad;
      opt.text = p.nombre_propiedad;
      opt.dataset.nombre = p.nombre_propiedad;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading properties', err);
  }
}

/* ============================================================
   🚪 Cargar habitaciones de una propiedad
============================================================ */
async function loadRooms(id_propiedad, nombre) {
  const container = qs('roomsList');
  container.innerHTML = '<p>Cargando habitaciones...</p>';
  qs('roomsEmptyState').classList.add('d-none');

  try {
    const res = await fetch(`${API}/api/properties/${id_propiedad}/habitaciones`);
    if (!res.ok) throw new Error('Error cargando habitaciones');

    const rooms = await res.json();

    if (!Array.isArray(rooms) || rooms.length === 0) {
      container.innerHTML = '';
      qs('roomsEmptyState').classList.remove('d-none');
      return;
    }

    // For each room, fetch details
    const detailed = await Promise.all(rooms.map(async (r) => {
      try {
        const dres = await fetch(`${API}/api/rooms/${r.id_habitacion}`);
        if (!dres.ok) return r;
        return await dres.json();
      } catch (err) { return r; }
    }));

    let html = '';
    detailed.forEach(r => {
      const fotos = Array.isArray(r.fotos) ? r.fotos : [];
      const fotoHtml = fotos.length ? fotos.map(f => {
        const src = (f.url && f.url.startsWith('http')) ? f.url : `/fotosHabitaciones/${f.url}`;
        return `<img src="${src}" class="img-fluid rounded" style="height:160px; width:100%; object-fit:cover;">`;
      }).join('') : `<div class="bg-light d-flex align-items-center justify-content-center" style="height:160px">No hay fotos</div>`;

      const serviciosHtml = (r.servicios || []).map(s => `<span class="badge bg-secondary me-1 small">${s.nombre}</span>`).join(' ');

      html += `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <div class="mb-2">${fotoHtml}</div>
              <h6 class="card-title">Habitación #${r.id_habitacion}</h6>
              <p class="card-text small">${r.descripcion || ''}</p>
              <ul class="list-unstyled small mb-2">
                <li>Capacidad: ${r.capacidad_maxima || 'N/A'}</li>
                <li>Precio noche: $${r.precio_por_noche || '0'}</li>
                <li>Precio semana: $${r.precio_por_semana || '0'}</li>
                <li>Precio mes: $${r.precio_por_mes || '0'}</li>
                <li>Estado: ${r.estado_habitacion || r.estado || 'N/A'}</li>
              </ul>
              <div class="mb-2">${serviciosHtml}</div>
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
      try {
        const res = await fetch(`${API}/api/rooms/${id}`);
        if (!res.ok) throw new Error('No details');
        const room = await res.json();
        openRoomModalForEdit(room);
      } catch (err) {
        console.error(err);
        alert('No se pudo cargar la habitación');
      }
    }));

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-danger">Error al cargar habitaciones.</p>';
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
  modal.show();
}

function openRoomModalForEdit(room) {
  const modalEl = qs('modalRoom');
  const modal = new bootstrap.Modal(modalEl);
  qs('modalRoomTitle').innerText = `Editar habitación #${room.id_habitacion}`;
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
      res = await fetch(`${API}/api/rooms/${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      res = await fetch(`${API}/api/rooms`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }

    if (!res.ok) {
      let errBody = null;
      try { errBody = await res.json(); } catch(e) { errBody = { message: await res.text().catch(()=>'') }; }
      const msg = errBody && (errBody.error || errBody.message) ? (errBody.error || errBody.message) : res.statusText;
      if (res.status === 401) {
        alert('No autorizado. Por favor inicia sesión como anfitrión para guardar habitaciones.');
        window.location.href = '/login';
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
      const up = await fetch(`${API}/api/rooms/${roomId}/photos`, { method: 'POST', credentials: 'include', body: form });
      if (!up.ok) console.warn('Warning uploading photos');
    }

    // Save services
    const checked = Array.from(document.querySelectorAll('#servicesContainer input[type=checkbox]:checked')).map(i => Number(i.value));
    if (checked.length > 0) {
      const svcRes = await fetch(`${API}/api/rooms/${roomId}/services`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ servicios: checked }) });
      if (!svcRes.ok) {
        let errBody = null;
        try { errBody = await svcRes.json(); } catch(e) { errBody = { message: await svcRes.text().catch(()=>'') }; }
        const msg = errBody && (errBody.error || errBody.message) ? (errBody.error || errBody.message) : svcRes.statusText;
        if (svcRes.status === 401) {
          alert('No autorizado al guardar servicios. Inicia sesión como anfitrión.');
          window.location.href = '/login';
          return;
        }
        if (svcRes.status === 403) {
          alert('Prohibido: no tienes permisos de anfitrión para asignar servicios.');
          return;
        }
        console.warn('Warning saving services:', svcRes.status, msg);
      }
    }

    // close modal and reload
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



