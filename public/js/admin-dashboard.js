    // ========== SECCIÓN DE SERVICIOS GLOBALES (ADMIN) =============
    const serviciosTab = document.getElementById('tab-servicios');
    const serviciosPane = document.getElementById('servicios');
    const serviciosTableContainer = document.getElementById('serviciosTableContainer');
    const formAddServicio = document.getElementById('formAddServicio');
    const serviciosSearchInput = document.getElementById('serviciosSearchInput');
    let serviciosList = [];
    if (serviciosTab && serviciosPane && serviciosTableContainer && formAddServicio && serviciosSearchInput) {
        serviciosTab.addEventListener('shown.bs.tab', loadServicios);
        serviciosSearchInput.addEventListener('input', renderServiciosTable);
        formAddServicio.onsubmit = async (ev) => {
            ev.preventDefault();
            const nombre = (serviciosSearchInput.value || '').trim();
            if (!nombre) return;
            // Validar en frontend si ya existe (case-insensitive)
            if (serviciosList.some(s => s.nombre.toLowerCase() === nombre.toLowerCase())) {
                alert('Ese servicio ya existe.');
                return;
            }
            // POST al backend
            const res = await fetch('/api/admin/servicios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });
            if (res.ok) {
                formAddServicio.reset();
                await loadServicios();
            } else {
                alert('Error al agregar servicio');
            }
        };
        async function loadServicios() {
            serviciosTableContainer.innerHTML = 'Cargando...';
            try {
                const res = await fetch('/api/admin/servicios');
                if (!res.ok) throw new Error();
                serviciosList = await res.json();
                renderServiciosTable();
            } catch {
                serviciosTableContainer.innerHTML = '<p class="text-danger">Error cargando servicios.</p>';
            }
        }
        function renderServiciosTable() {
            let filtered = serviciosList;
            const q = (serviciosSearchInput.value || '').trim().toLowerCase();
            if (q) {
                filtered = serviciosList.filter(s => s.nombre.toLowerCase().includes(q));
            }
            if (!filtered.length) {
                serviciosTableContainer.innerHTML = '<p class="text-muted">No hay servicios registrados para ese criterio.</p>';
                return;
            }
                        let html = `<div class="card shadow-sm">
                            <div class="card-body p-0">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th style="width:60%">Servicio</th>
                                            <th style="width:40%" class="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;
                        filtered.forEach(s => {
                                html += `<tr>
                                    <td class="fw-semibold">${s.nombre}</td>
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-danger btn-del-servicio" data-id="${s.id_servicio}">
                                            <i class="bi bi-trash"></i> Eliminar
                                        </button>
                                    </td>
                                </tr>`;
                        });
                        html += `</tbody></table></div></div>`;
                        serviciosTableContainer.innerHTML = html;
                        document.querySelectorAll('.btn-del-servicio').forEach(btn => {
                                btn.onclick = async function() {
                                        if (!confirm('¿Eliminar este servicio?')) return;
                                        const id = btn.dataset.id;
                                        const res = await fetch(`/api/admin/servicios/${id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                                await loadServicios();
                                        } else {
                                                alert('Error al eliminar servicio');
                                        }
                                };
                        });
        }
    }
// ========== SECCIÓN DE REPORTES PARA ADMIN ==========
document.addEventListener('DOMContentLoaded', () => {
    // === LOGOUT BUTTON HANDLER ===
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
            } catch {}
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '/login.html';
        });
    }
        // ========== SECCIÓN DE RESERVAS PARA ADMIN =============
        const reservasTab = document.getElementById('tab-reservas');
        const reservasPane = document.getElementById('reservas');
        const reservasTableContainer = document.getElementById('reservasTableContainer');
        // Nuevo: filtro por texto
        let reservasList = [];
        if (reservasTab && reservasPane && reservasTableContainer) {
            reservasTab.addEventListener('shown.bs.tab', async () => {
                reservasTableContainer.innerHTML = '<p>Cargando reservas...</p>';
                // Input de búsqueda
                let searchInput = document.getElementById('reservasSearchInput');
                if (!searchInput) {
                    const row = document.createElement('div');
                    row.className = 'row mb-3';
                    row.innerHTML = `<div class="col-md-6"><input id="reservasSearchInput" class="form-control" placeholder="Buscar por anfitrión, propiedad, cliente, cuarto, estado..."></div>`;
                    reservasPane.insertBefore(row, reservasPane.children[1]);
                    searchInput = document.getElementById('reservasSearchInput');
                }
                try {
                    const res = await fetch('/api/admin/reservas', { credentials: 'same-origin' });
                    if (!res.ok) throw new Error('No se pudo cargar reservas');
                    reservasList = await res.json();
                    renderReservasTable();
                    searchInput.oninput = renderReservasTable;
                } catch (err) {
                    reservasTableContainer.innerHTML = '<p class="text-danger">Error cargando reservas.</p>';
                }
            });

            function renderReservasTable() {
                let filtered = reservasList;
                const searchInput = document.getElementById('reservasSearchInput');
                const q = searchInput && searchInput.value ? searchInput.value.toLowerCase() : '';
                if (q) {
                    filtered = filtered.filter(r => {
                        return (
                            (r.anfitrion || '').toLowerCase().includes(q) ||
                            (r.propiedad || '').toLowerCase().includes(q) ||
                            (r.cuarto || '').toLowerCase().includes(q) ||
                            (r.cliente || '').toLowerCase().includes(q) ||
                            (r.estado_reserva || '').toLowerCase().includes(q)
                        );
                    });
                }
                // Ordenar por fecha de entrada más próxima
                filtered = filtered.slice().sort((a, b) => {
                    const da = a.fecha_entrada ? new Date(a.fecha_entrada) : new Date(0);
                    const db = b.fecha_entrada ? new Date(b.fecha_entrada) : new Date(0);
                    return da - db;
                });
                if (!filtered.length) {
                    reservasTableContainer.innerHTML = '<p class="text-muted">No hay reservas para el criterio de búsqueda.</p>';
                    return;
                }
                let html = `<table class="table table-striped"><thead><tr><th>Anfitrión</th><th>Propiedad</th><th>Cuarto</th><th>Cliente</th><th>Entrada</th><th>Salida</th><th>Estado</th><th>Total</th></tr></thead><tbody>`;
                filtered.forEach(r => {
                    let badge = '-';
                    if (r.estado_reserva) {
                        if (r.estado_reserva === 'aprobada') badge = '<span class="badge bg-success">Aprobada</span>';
                        else if (r.estado_reserva === 'cancelada') badge = '<span class="badge bg-danger">Cancelada</span>';
                        else badge = `<span class="badge bg-secondary">${r.estado_reserva}</span>`;
                    }
                    html += `<tr>
                        <td>${r.anfitrion || '-'}</td>
                        <td>${r.propiedad || '-'}</td>
                        <td>${r.cuarto || '-'}</td>
                        <td>${r.cliente || '-'}</td>
                        <td>${r.fecha_entrada ? new Date(r.fecha_entrada).toLocaleDateString('es-MX') : '-'}</td>
                        <td>${r.fecha_salida ? new Date(r.fecha_salida).toLocaleDateString('es-MX') : '-'}</td>
                        <td>${badge}</td>
                        <td>$${parseFloat(r.monto_total || 0).toFixed(2)}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                reservasTableContainer.innerHTML = html;
            }
        }
    const reportesTab = document.getElementById('tab-reportes');
    const reportesPane = document.getElementById('reportes');
    const reportesContainer = document.getElementById('adminReportesContainer');
    if (reportesTab && reportesPane && reportesContainer) {
        let hostsList = [];
        function renderReportesUI() {
            let html = `<div class="mb-3">
                <label class="form-label">Buscar anfitrión</label>
                <input id="filterInputReport" class="form-control" placeholder="Buscar por nombre, email o id">
            </div>
            <div class="table-responsive mb-3">
                <table class="table table-striped" id="hostsTableReport">
                    <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Acciones</th></tr></thead>
                    <tbody>
                        ${hostsList.map(h => `
                            <tr data-id="${h.id_usuario || h.id}">
                                <td>${h.id_usuario || h.id}</td>
                                <td>${h.nombre_completo || h.nombre || '-'}</td>
                                <td>${h.email || h.correo_electronico || '-'}</td>
                                <td><button class="btn btn-sm btn-accent btn-ver-ventas">Ver Ventas</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mb-3 d-flex gap-2">
                <button id="btnPdfVentas" class="btn btn-outline-primary" disabled>Descargar PDF</button>
            </div>
            <div id="reportesResultados"></div>`;
            reportesContainer.innerHTML = html;

            let lastVentas = [];
            let lastHostId = null;

            // Filtro de búsqueda
            document.getElementById('filterInputReport').addEventListener('input', function() {
                const q = this.value.toLowerCase();
                const rows = document.querySelectorAll('#hostsTableReport tbody tr');
                rows.forEach(tr => {
                    const name = tr.children[1].textContent.toLowerCase();
                    const email = tr.children[2].textContent.toLowerCase();
                    const id = tr.children[0].textContent.toLowerCase();
                    tr.style.display = (name.includes(q) || email.includes(q) || id.includes(q)) ? '' : 'none';
                });
            });

            // Acción ver ventas
            document.querySelectorAll('.btn-ver-ventas').forEach(btn => {
                btn.onclick = async function() {
                    const tr = btn.closest('tr');
                    const hostId = tr.dataset.id;
                    if (!hostId) return alert('ID no encontrado');
                    const res = await fetch(`/api/host/${hostId}/ventas`);
                    if (!res.ok) return alert('Error obteniendo ventas');
                    const ventas = await res.json();
                    lastVentas = ventas;
                    lastHostId = hostId;
                    renderVentasTable(ventas);
                    document.getElementById('btnPdfVentas').disabled = false;
                };
            });

            document.getElementById('btnPdfVentas').onclick = async () => {
                if (!lastHostId) return alert('Primero genera un reporte para descargar.');
                try {
                    const res = await fetch(`/api/host/${lastHostId}/ventas/periodo/pdf?year=${new Date().getFullYear()}`);
                    if (!res.ok) throw new Error('Error generando PDF');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `reporte_ventas_admin_${lastHostId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } catch (err) {
                    alert('Error generando PDF');
                }
            };
        }

        function renderVentasTable(rows) {
            const container = document.getElementById('reportesResultados');
            if (!rows || !rows.length) {
                container.innerHTML = '<p class="text-muted">No hay ventas para el anfitrión seleccionado.</p>';
                return;
            }
            let html = `<table class="table table-striped"><thead><tr><th>Propiedad</th><th>Cuarto</th><th>Cliente</th><th>Entrada</th><th>Salida</th><th>Pago</th><th>Estado</th><th>Total</th></tr></thead><tbody>`;
            rows.forEach(v => {
                let estado = v.estado_pago || '-';
                let estadoHtml = '';
                if (estado === 'aprobado') {
                    estadoHtml = `<span class="badge bg-success">Aprobado</span>`;
                } else if (estado === 'rechazado') {
                    estadoHtml = `<span class="badge bg-danger">Rechazado</span>`;
                } else {
                    estadoHtml = `<span class="badge bg-secondary">${estado.charAt(0).toUpperCase() + estado.slice(1)}</span>`;
                }
                html += `<tr><td>${v.propiedad || '-'}</td><td>${v.cuarto || '-'}</td><td>${v.cliente || '-'}</td><td>${v.fecha_entrada ? new Date(v.fecha_entrada).toLocaleDateString('es-MX') : '-'}</td><td>${v.fecha_salida ? new Date(v.fecha_salida).toLocaleDateString('es-MX') : '-'}</td><td>${v.fecha_pago ? new Date(v.fecha_pago).toLocaleDateString('es-MX') : '-'}</td><td>${estadoHtml}</td><td>$${parseFloat(v.total || 0).toFixed(2)}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }

        // Cargar lista de anfitriones al cambiar a la pestaña de reportes
        reportesTab.addEventListener('shown.bs.tab', () => {
            hostsList = window.hosts || [];
            renderReportesUI();
        });
    }
});
// ...restaurar aquí la versión previa funcional del archivo, sin la lógica de PDF ni la sección de reportes admin...
/* public/js/admin-dashboard.js */
document.addEventListener('DOMContentLoaded', () => {
  const API = location.origin;
  const hostsTableContainer = document.getElementById('hostsTableContainer');
  const filterInput = document.getElementById('filterInput');
  const btnReload = document.getElementById('btnReload');
  const summary = document.getElementById('summary');

  const modalPropsEl = document.getElementById('modalProps');
  const modalRoomsEl = document.getElementById('modalRooms');
  const modalProps = new bootstrap.Modal(modalPropsEl);
  const modalRooms = new bootstrap.Modal(modalRoomsEl);

  let hosts = [];

  btnReload.addEventListener('click', loadHosts);
  filterInput.addEventListener('input', () =>
      renderHosts(filterHosts(filterInput.value))
    );

  // Primary: try /api/admin/hosts, then fallbacks
  async function tryFetchHosts() {
      const candidates = [
          '/api/admin/hosts',
          '/api/users?role=host',
          '/api/users'
      ];
      for (const path of candidates) {
      try {
        const res = await fetch(API + path, { credentials: 'same-origin' });
        if (!res.ok) continue;
        const data = await res.json();
        return { path, data };
      } catch (err) {
        console.warn('fetch hosts failed for', path, err);
        continue;
      }
    }
    throw new Error('No hay endpoint disponible para listar anfitriones');
  }

  function filterHosts(q) {
    if (!q) return hosts;
    q = q.toLowerCase();
      return hosts.filter((h) => {
          const name = (
              h.nombre_completo ||
              h.nombre ||
              ''
          )
              .toString()
              .toLowerCase();
          const email = (
              h.correo_electronico ||
              h.email ||
              ''
          )
              .toString()
              .toLowerCase();
      const id = String(h.id_usuario || h.id || '');
      return name.includes(q) || email.includes(q) || id.includes(q);
    });
  }

  function renderSummary() {
    const totalHosts = hosts.length;
    const card = `<div class="p-2 bg-light rounded">
      <strong>Total anfitriones</strong><div class="fs-4">${totalHosts}</div>
    </div>`;
    summary.innerHTML = card;
  }

  function renderHosts(list = hosts) {
    if (!list || list.length === 0) {
        hostsTableContainer.innerHTML = '<p class="text-muted">No se encontraron anfitriones.</p>';
        return;
    }

        let html = `<table class="table table-striped">
            <thead><tr>
                <th>ID</th><th>Nombre</th><th>Email</th><th>Activo</th><th>Acciones</th>
            </tr></thead><tbody>`;
        list.forEach((h) => {
            const id = h.id_usuario || h.id || '';
            const name = h.nombre_completo || h.nombre || '-';
            const email = h.correo_electronico || h.email || '-';
            const activo = (h.activo === 0 || h.activo === false) ? 'No' : 'Sí';

            html += `<tr data-id="${id}">
                <td>${id}</td>
                <td>${name}</td>
                <td>${email}</td>
                <td>${activo}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-view-props">Propiedades</button>
                    <button class="btn btn-sm btn-info btn-view-rooms">Habitaciones</button>
                    <button class="btn btn-sm btn-warning btn-toggle-block">${activo === 'Sí' ? 'Bloquear' : 'Desbloquear'}</button>
                </td>
            </tr>`;
        });

    html += '</tbody></table>';
    hostsTableContainer.innerHTML = html;
    document.querySelectorAll('.btn-view-props').forEach(b => b.addEventListener('click', onViewProps));
    document.querySelectorAll('.btn-view-rooms').forEach(b => b.addEventListener('click', onViewRooms));
    document.querySelectorAll('.btn-toggle-block').forEach(b => b.addEventListener('click', onToggleBlock));
  }

  async function loadHosts() {
    hostsTableContainer.innerHTML = '<p>Cargando anfitriones...</p>';
    try {
        const { path, data } = await tryFetchHosts();
        let list = data;

        if (path === '/api/users') {
            list = data.filter((u) => {
                const roles = u.roles || [];
                if (Array.isArray(roles))
                    return roles.some((r) =>
                        /host|anfitri|propietar/i.test(String(r))
                    );
                if (typeof roles === 'string')
                    return /host|anfitri|propietar/i.test(roles);
                return false;
            });
        }

        hosts = list;
        window.hosts = hosts; // Hacer accesible globalmente para reportes
        renderSummary();
        renderHosts(hosts);
    } catch (err) {
        console.error(err);
        hostsTableContainer.innerHTML =
            '<p class="text-danger">No se pudo cargar la lista de anfitriones.</p>';
    }
}

    // === util: obtener ID del <tr> ===
    function getRowIdFromBtn(btn) {
    const tr = btn.closest('tr');
    return tr ? tr.dataset.id : null;
  }

  // === ver propiedades de un anfitrión (modal) ===
  async function onViewProps(e) {
                // Agregar propiedad (formulario simple)
                const addPropBtn = document.createElement('button');
                addPropBtn.className = 'btn btn-success mb-3';
                addPropBtn.textContent = 'Agregar Propiedad';
                addPropBtn.onclick = () => {
                    const formHtml = `
                        <form id="formAddProp" class="mb-3">
                            <div class="mb-2"><input class="form-control" name="nombre_propiedad" placeholder="Nombre de la propiedad" required></div>
                            <div class="mb-2"><input class="form-control" name="municipio" placeholder="Municipio"></div>
                            <div class="mb-2"><input class="form-control" name="estado" placeholder="Estado"></div>
                            <button type="submit" class="btn btn-primary">Guardar</button>
                        </form>`;
                    document.getElementById('modalPropsBody').insertAdjacentHTML('afterbegin', formHtml);
                    document.getElementById('formAddProp').onsubmit = async (ev) => {
                        ev.preventDefault();
                        const fd = new FormData(ev.target);
                        fd.append('id_anfitrion', id);
                        const res = await fetch(`${API}/api/properties`, { method: 'POST', body: fd, credentials: 'same-origin' });
                        if (res.ok) {
                            alert('Propiedad agregada');
                            onViewProps(e);
                            loadHosts();
                        } else {
                            alert('Error al agregar propiedad');
                        }
                    };
                    addPropBtn.disabled = true;
                };
                document.getElementById('modalPropsBody').prepend(addPropBtn);
        const id = getRowIdFromBtn(e.currentTarget);
        if (!id) return alert('ID no encontrado');
        document.getElementById('modalPropsTitle').innerText = `Propiedades del anfitrión ${id}`;
        document.getElementById('modalPropsBody').innerHTML = 'Cargando...';
        modalProps.show();

        try {
            const res = await fetch(`${API}/api/properties/host/${id}`, { credentials: 'same-origin' });
            if (!res.ok) throw new Error('Error al cargar propiedades');
            const props = await res.json();

            if (!props || props.length === 0) {
                document.getElementById('modalPropsBody').innerHTML = '<p class="text-muted">No tiene propiedades.</p>';
                return;
            }

            let html = `<div class="row">`;
            props.forEach((p) => {
                const foto = p.url_fotos_p ? `/fotosPropiedades/${p.url_fotos_p}` : '/fotosPropiedades/placeholder.jpg';
                html += `<div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="row g-0">
                            <div class="col-4">
                                <img src="${foto}" class="img-fluid" style="height:100%; object-fit:cover;">
                            </div>
                            <div class="col-8 p-2">
                                <h5 class="mb-1">${p.nombre_propiedad}</h5>
                                <div class="small">${p.municipio || ''} - ${p.estado || ''}</div>
                                <div class="mt-2 d-flex gap-2">
                                    <button class="btn btn-sm btn-danger btn-delete-prop" data-id="${p.id_propiedad}">Eliminar</button>
                                    <button class="btn btn-sm btn-outline-primary btn-view-rooms-prop" data-id="${p.id_propiedad}" data-name="${p.nombre_propiedad}">Habitaciones</button>
                                    <button class="btn btn-sm btn-success btn-add-room" data-id="${p.id_propiedad}" data-name="${p.nombre_propiedad}">Agregar Habitación</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            html += `</div>`;
            document.getElementById('modalPropsBody').innerHTML = html;

            // Eliminar propiedad
            document.querySelectorAll('.btn-delete-prop').forEach((b) =>
                b.addEventListener('click', async (ev) => {
                    const pid = ev.currentTarget.dataset.id;
                    if (!confirm('Eliminar propiedad?')) return;
                    const r = await fetch(`${API}/api/admin/properties/${pid}`, { method: 'DELETE', credentials: 'same-origin' });
                    if (!r.ok) {
                        const err = await r.json().catch(() => ({}));
                        return alert(err.error || 'No se pudo eliminar propiedad');
                    }
                    alert('Propiedad eliminada');
                    onViewProps(e);
                    loadHosts();
                })
            );

            // Agregar habitación (solo muestra alerta, implementar modal/form real si lo deseas)
            document.querySelectorAll('.btn-add-room').forEach((b) =>
                b.addEventListener('click', (ev) => {
                    const pid = ev.currentTarget.dataset.id;
                    const container = ev.currentTarget.closest('.col-8').querySelector('.add-room-form-container');
                    if (!container) return;
                    // Evitar múltiples formularios
                    if (container.innerHTML.trim() !== '') return;
                    const formHtml = `
                        <form id="formAddRoom-${pid}" class="border rounded p-2 bg-light mb-2">
                          <div class="mb-2"><input class="form-control" name="descripcion" placeholder="Descripción" required></div>
                          <div class="mb-2"><input class="form-control" name="capacidad_maxima" type="number" min="1" placeholder="Capacidad máxima" required></div>
                          <div class="mb-2"><input class="form-control" name="precio_por_noche" type="number" min="0" step="0.01" placeholder="Precio por noche" required></div>
                          <button type="submit" class="btn btn-primary btn-sm">Guardar</button>
                          <button type="button" class="btn btn-link btn-sm btn-cancel-add-room">Cancelar</button>
                        </form>`;
                    container.innerHTML = formHtml;
                    const form = document.getElementById(`formAddRoom-${pid}`);
                    form.onsubmit = async (ev2) => {
                        ev2.preventDefault();
                        const fd = new FormData(form);
                        fd.append('id_propiedad', pid);
                        const res = await fetch(`${API}/api/habitaciones`, { method: 'POST', body: fd, credentials: 'same-origin' });
                        if (res.ok) {
                            alert('Habitación agregada');
                            onViewProps(ev);
                            loadHosts();
                        } else {
                            alert('Error al agregar habitación');
                        }
                    };
                    form.querySelector('.btn-cancel-add-room').onclick = () => { container.innerHTML = ''; };
                })
            );

            // Ver habitaciones de la propiedad
            document.querySelectorAll('.btn-view-rooms-prop').forEach((b) =>
                b.addEventListener('click', (ev) => {
                    const pid = ev.currentTarget.dataset.id;
                    const name = ev.currentTarget.dataset.name || pid;
                    fetch(`${API}/api/properties/${pid}/habitaciones`, { credentials: 'same-origin' })
                        .then((r) => {
                            if (!r.ok) throw new Error();
                            return r.json();
                        })
                        .then((rooms) => {
                            let html = `<h6>Habitaciones de ${name}</h6>`;
                            if (!rooms.length)
                                html += '<p class="text-muted">No hay habitaciones.</p>';
                            else {
                                html += '<div class="list-group">';
                                rooms.forEach((room) => {
                                    html += `<div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>ID ${room.id_habitacion}</strong> - ${room.descripcion || ''}
                                            <div class="small">Capacidad: ${room.capacidad_maxima || '-'} - Precio: $${room.precio_por_noche || 0}</div>
                                        </div>
                                        <button class="btn btn-sm btn-danger btn-del-room" data-id="${room.id_habitacion}">Eliminar</button>
                                    </div>`;
                                });
                                html += '</div>';
                            }
                            document.getElementById('modalRoomsTitle').innerText = `Habitaciones - ${name}`;
                            document.getElementById('modalRoomsBody').innerHTML = html;
                            modalRooms.show();

                            // Eliminar habitación
                            document.querySelectorAll('.btn-del-room').forEach((btn) =>
                                btn.addEventListener('click', async (ev2) => {
                                    const rid = ev2.currentTarget.dataset.id;
                                    if (!confirm('Eliminar habitación?')) return;
                                    const rr = await fetch(`${API}/api/admin/habitaciones/${rid}`, { method: 'DELETE', credentials: 'same-origin' });
                                    if (!rr.ok) {
                                        const err = await rr.json().catch(() => ({}));
                                        return alert(err.error || 'Error al eliminar');
                                    }
                                    alert('Habitación eliminada');
                                    ev.currentTarget.click();
                                })
                            );
                        })
                        .catch(() => alert('Error al cargar habitaciones'));
                })
            );
        } catch (err) {
            console.error(err);
            document.getElementById('modalPropsBody').innerHTML = '<p class="text-danger">Error al cargar propiedades.</p>';
        }
    }

    // === ver habitaciones del anfitrión ===
    async function onViewRooms(e) {
        const id = getRowIdFromBtn(e.currentTarget);
        if (!id) return alert('ID no encontrado');

        document.getElementById(
            'modalRoomsTitle'
        ).innerText = `Habitaciones del anfitrión ${id}`;
        document.getElementById('modalRoomsBody').innerHTML = 'Cargando...';
        modalRooms.show();

        try {
            const r1 = await fetch(
                `${API}/api/properties/host/${id}`,
                { credentials: 'same-origin' }
            );
            if (!r1.ok) throw new Error('Error al obtener propiedades');

            const props = await r1.json();
            if (!props || props.length === 0) {
                document.getElementById('modalRoomsBody').innerHTML =
                    '<p class="text-muted">No hay propiedades.</p>';
                return;
            }

            let allRooms = [];
            for (const p of props) {
                try {
                    const r2 = await fetch(
                        `${API}/api/properties/${p.id_propiedad}/habitaciones`,
                        { credentials: 'same-origin' }
                    );
                    if (!r2.ok) continue;
                    const rooms = await r2.json();
                    rooms.forEach((room) => {
                        room._propiedad = p.nombre_propiedad;
                        room._id_propiedad = p.id_propiedad;
                    });
                    allRooms = allRooms.concat(rooms);
                } catch {}
            }

            if (!allRooms.length) {
                document.getElementById('modalRoomsBody').innerHTML =
                    '<p class="text-muted">No hay habitaciones registradas.</p>';
                return;
            }

            let html = '<div class="list-group">';
            allRooms.forEach((room) => {
                html += `<div class="list-group-item">
          <div><strong>Propiedad:</strong> ${room._propiedad}</div>
          <div><strong>ID Habitación:</strong> ${room.id_habitacion}</div>
          <div>${room.descripcion || ''}</div>
          <div class="mt-1 small">
            Precio: $${room.precio_por_noche || 0} - Capacidad: ${
                    room.capacidad_maxima || '-'
                }
          </div>
          <div class="mt-2">
            <button class="btn btn-sm btn-danger btn-del-room-global" data-id="${
                    room.id_habitacion
                }">Eliminar</button>
            <button class="btn btn-sm btn-secondary btn-edit-room" 
              data-id="${room.id_habitacion}" 
              data-prop="${room._id_propiedad}">
              Editar
            </button>
          </div>
        </div>`;
            });
            html += '</div>';

            document.getElementById('modalRoomsBody').innerHTML = html;

            document
                .querySelectorAll('.btn-del-room-global')
                .forEach((b) =>
                    b.addEventListener('click', async (ev) => {
                        const rid = ev.currentTarget.dataset.id;
                        if (!confirm('Eliminar habitación?')) return;
                        const rr = await fetch(
                            `${API}/api/admin/habitaciones/${rid}`,
                            { method: 'DELETE', credentials: 'same-origin' }
                        );
                        if (!rr.ok) return alert('No se pudo eliminar habitación');
                        alert('Habitación eliminada');
                        loadHosts();
                    })
                );

            document
                .querySelectorAll('.btn-edit-room')
                .forEach((b) =>
                    b.addEventListener('click', (ev) => {
                        const rid = ev.currentTarget.dataset.id;
                        const pid = ev.currentTarget.dataset.prop;
                        window.location.href = `/admin/edit-room.html?property=${pid}&room=${rid}`;
                    })
                );
        } catch (err) {
            console.error(err);
            document.getElementById('modalRoomsBody').innerHTML =
                '<p class="text-danger">Error al cargar habitaciones.</p>';
        }
    }

    // === bloquear / desbloquear ===
    async function onToggleBlock(e) {
        const id = getRowIdFromBtn(e.currentTarget);
        if (!id) return alert('ID no encontrado');

        try {
            const host = hosts.find(
                (h) => String(h.id_usuario || h.id) === String(id)
            );
            const isActive = !(
                host &&
                (host.activo === 0 || host.activo === false)
            );

            const url = `${API}/api/auth/${isActive ? 'block' : 'unblock'}/${id}`;
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin'
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return alert(err.error || 'No se pudo cambiar estado');
            }

            alert(isActive ? 'Usuario bloqueado' : 'Usuario desbloqueado');
            loadHosts();
        } catch {
            alert('Error cambiando estado');
        }
    }

    // inicial
    loadHosts();
});
