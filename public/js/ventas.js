// ventas.js — carga las ventas del host autenticado (modo prueba)
// const testHostId = 4;
// window.hostId = testHostId;

// Helper: formatea valores monetarios (misma lógica que en reports.js)
function formatCurrency(value) {
    return `$${parseFloat(value || 0).toFixed(2)}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const ventasDiv = document.getElementById("ventasTable");
    if (!ventasDiv) return;

    const hostId = window.hostId;
    if (!hostId) {
        ventasDiv.innerHTML = "<p class='text-danger'>No se encontró host_id. ¿Iniciaste sesión?</p>";
        return;
    }

    try {
        const res = await fetch(`/api/host/${hostId}/ventas`);

        if (!res.ok) {
            ventasDiv.innerHTML = "<p class='text-danger'>Error cargando ventas.</p>";
            console.error("Error HTTP:", res.status, res.statusText);
            return;
        }

        const ventas = await res.json();

        if (!Array.isArray(ventas) || ventas.length === 0) {
            ventasDiv.innerHTML = "<p class='text-muted'>No hay ventas registradas para este host.</p>";
            return;
        }

        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Propiedad</th>
                        <th>Cuarto</th>
                        <th>Cliente</th>
                        <th>Fecha entrada</th>
                        <th>Fecha salida</th>
                        <th>Fecha de pago</th>
                        <th>Estado</th>
                        <th>Total pagado</th>
                    </tr>
                </thead>
                <tbody>
        `;

        ventas.forEach(v => {
            const pagoFecha = v.fecha_pago ? new Date(v.fecha_pago).toLocaleDateString('es-MX') : '-';
            const estado = (v.estado_pago || '').toLowerCase();
            const estadoBadge = estado === 'aprobado'
                ? `<span class="badge bg-success">Aprobado</span>`
                : (v.estado_pago ? `<span class="badge bg-danger">${v.estado_pago}</span>` : `<span class="badge bg-secondary">-</span>`);

            html += `
                <tr>
                    <td>${v.propiedad || "-"}</td>
                    <td>${v.cuarto || "-"}</td>
                    <td>${v.cliente || "-"}</td>
                    <td>${v.fecha_entrada ? new Date(v.fecha_entrada).toLocaleDateString('es-MX') : '-'}</td>
                    <td>${v.fecha_salida ? new Date(v.fecha_salida).toLocaleDateString('es-MX') : '-'}</td>
                    <td>${pagoFecha}</td>
                    <td>${estadoBadge}</td>
                    <td>${formatCurrency(v.total)}</td>
                </tr>`;
        });

        html += "</tbody></table>";
        ventasDiv.innerHTML = html;

    } catch (err) {
        ventasDiv.innerHTML = "<p class='text-danger'>Error cargando ventas.</p>";
        console.error("Error en fetch:", err);
    }
});
