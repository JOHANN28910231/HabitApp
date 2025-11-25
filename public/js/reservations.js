// reservations.js — carga reservaciones próximas para el host, filtro por propiedad
document.addEventListener('DOMContentLoaded', async () => {
  // Forzar hostId de prueba solo si no hay uno en el DOM
  const testHostId = 2;
  window.hostId = testHostId;

  const reservasContainer = document.getElementById('reservasTable');
  const propFilter = document.getElementById('propFilter');

  try {
    const res = await fetch(`/api/host/${hostId}/reservaciones/proximas`);
    if (!res.ok) {
      reservasContainer.innerHTML = '<p class="text-danger">Error cargando reservaciones.</p>';
      return;
    }

    const rows = await res.json();

    // extraer propiedades únicas para filtro
    const props = [];
    rows.forEach(r => {
      const key = `${r.propiedad}`;
      if (key && !props.includes(key)) props.push(key);
    });

    // render filtro
    if (propFilter) {
      let html = '<option value="">Todas las propiedades</option>';
      props.forEach(p => {
        html += `<option value="${p}">${p}</option>`;
      });
      propFilter.innerHTML = html;
      propFilter.addEventListener('change', () => renderTable(rows, propFilter.value));
    }

    // ordenar por fecha de entrada asc
    rows.sort((a, b) => {
      const da = a.fecha_entrada ? new Date(a.fecha_entrada) : new Date(0);
      const db = b.fecha_entrada ? new Date(b.fecha_entrada) : new Date(0);
      return da - db;
    });

    renderTable(rows, '');

  } catch (err) {
    console.error(err);
    reservasContainer.innerHTML = '<p class="text-danger">Error cargando reservaciones.</p>';
  }

  function formatDate(d) {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('es-MX'); } catch (e) { return d; }
  }

  function renderTable(rows, filterProp) {
    const filtered = !filterProp ? rows : rows.filter(r => r.propiedad === filterProp);
    if (!filtered || filtered.length === 0) {
      reservasContainer.innerHTML = '<p class="text-muted">No hay reservaciones próximas.</p>';
      return;
    }

    let html = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Descripción</th>
            <th>Cuarto</th>
            <th>Cliente</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtered.forEach(r => {
      const desc = r.propiedad_descripcion ? (r.propiedad_descripcion.length > 140 ? r.propiedad_descripcion.slice(0, 137) + '...' : r.propiedad_descripcion) : '-';
      html += `
        <tr>
          <td>${r.propiedad || '-'}</td>
          <td>${desc}</td>
          <td>${r.cuarto || '-'}</td>
          <td>${r.cliente || '-'}</td>
          <td>${formatDate(r.fecha_entrada)}</td>
          <td>${formatDate(r.fecha_salida)}</td>
          <td>$${parseFloat(r.total || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    reservasContainer.innerHTML = html;
  }
});
