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
        <th>ID</th><th>Nombre</th><th>Email</th><th>Roles</th><th>Activo</th><th>Acciones</th>
      </tr></thead><tbody>`;
    list.forEach((h) => {
      const id = h.id_usuario || h.id || '';
      const name = h.nombre_completo || h.nombre || '-';
      const email = h.correo_electronico || h.email || '-';
      const roles = (h.roles && typeof h.roles === 'string') ? h.roles : (Array.isArray(h.roles) ? h.roles.join(', ') : JSON.stringify(h.roles || '[]'));
      const activo = (h.activo === 0 || h.activo === false) ? 'No' : 'Sí';

      html += `<tr data-id="${id}">
        <td>${id}</td>
        <td>${name}</td>
        <td>${email}</td>
        <td>${roles}</td>
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
    const id = getRowIdFromBtn(e.currentTarget);
    if (!id) return alert('ID no encontrado');
    document.getElementById('modalPropsTitle').innerText = `Propiedades del anfitrión ${id}`;
    document.getElementById('modalPropsBody').innerHTML = 'Cargando...';
    modalProps.show();

      try {
          const res = await fetch(
              `${API}/api/properties/host/${id}`,
              { credentials: 'same-origin' }
          );
          if (!res.ok) throw new Error('Error al cargar propiedades');
          const props = await res.json();

          if (!props || props.length === 0) {
              document.getElementById('modalPropsBody').innerHTML =
                  '<p class="text-muted">No tiene propiedades.</p>';
              return;
          }

          let html = `<div class="row">`;
          props.forEach((p) => {
              const foto = p.url_fotos_p
                  ? `/fotosPropiedades/${p.url_fotos_p}`
                  : '/fotosPropiedades/placeholder.jpg';

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
                  <button class="btn btn-sm btn-secondary btn-edit-prop" data-id="${p.id_propiedad}">Editar</button>
                  <button class="btn btn-sm btn-outline-primary btn-view-rooms-prop" data-id="${p.id_propiedad}" data-name="${p.nombre_propiedad}">Habitaciones</button>
                </div>
              </div>
            </div>
          </div>
        </div>`;
          });

          html += `</div>`;
          document.getElementById('modalPropsBody').innerHTML = html;

          // acciones
          document
              .querySelectorAll('.btn-delete-prop')
              .forEach((b) =>
                  b.addEventListener('click', async (ev) => {
                      const pid = ev.currentTarget.dataset.id;
                      if (!confirm('Eliminar propiedad?')) return;
                      const r = await fetch(
                          `${API}/api/admin/properties/${pid}`,
                          { method: 'DELETE', credentials: 'same-origin' }
                      );
                      if (!r.ok) {
                          const err = await r.json().catch(() => ({}));
                          return alert(err.error || 'No se pudo eliminar propiedad');
                      }
                      alert('Propiedad eliminada');
                      onViewProps(e);
                      loadHosts();
                  })
              );

          document
              .querySelectorAll('.btn-edit-prop')
              .forEach((b) =>
                  b.addEventListener('click', (ev) => {
                      const pid = ev.currentTarget.dataset.id;
                      window.location.href = `/admin/edit-property.html?id=${pid}`;
                  })
              );

          document
              .querySelectorAll('.btn-view-rooms-prop')
              .forEach((b) =>
                  b.addEventListener('click', (ev) => {
                      const pid = ev.currentTarget.dataset.id;
                      const name = ev.currentTarget.dataset.name || pid;

                      fetch(
                          `${API}/api/properties/${pid}/habitaciones`,
                          { credentials: 'same-origin' }
                      )
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
                                      html += `<div class="list-group-item">
                      <strong>ID ${room.id_habitacion}</strong> - ${
                                          room.descripcion || ''
                                      }
                      <div class="small">Capacidad: ${
                                          room.capacidad_maxima || '-'
                                      } - Precio: $${room.precio_por_noche || 0}</div>
                      <div class="mt-1">
                        <button data-id="${
                                          room.id_habitacion
                                      }" class="btn btn-sm btn-danger btn-del-room">Eliminar</button>
                      </div>
                    </div>`;
                                  });
                                  html += '</div>';
                              }

                              document.getElementById(
                                  'modalRoomsTitle'
                              ).innerText = `Habitaciones - ${name}`;
                              document.getElementById('modalRoomsBody').innerHTML = html;
                              modalRooms.show();

                              document
                                  .querySelectorAll('.btn-del-room')
                                  .forEach((btn) =>
                                      btn.addEventListener('click', async (ev2) => {
                                          const rid = ev2.currentTarget.dataset.id;
                                          if (!confirm('Eliminar habitación?')) return;

                                          const rr = await fetch(
                                              `${API}/api/admin/habitaciones/${rid}`,
                                              { method: 'DELETE', credentials: 'same-origin' }
                                          );
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
          document.getElementById('modalPropsBody').innerHTML =
              '<p class="text-danger">Error al cargar propiedades.</p>';
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
