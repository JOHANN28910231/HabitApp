// ventas.js — carga las ventas del host autenticado (modo prueba)
window.hostId = 2; // HOST DE PRUEBA

document.addEventListener("DOMContentLoaded", async () => {
    const ventasDiv = document.getElementById("ventasTable");
    if (!ventasDiv) return;

    const hostId = window.hostId; // usamos hostId de prueba
    if (!hostId) {
        ventasDiv.innerHTML = "<p class='text-danger'>No se encontró host_id. ¿Iniciaste sesión?</p>";
        return;
    }

    try {
        // Endpoint Node.js: /api/host/:id/ventas
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
                        <th>Total pagado</th>
                    </tr>
                </thead>
                <tbody>
        `;

        ventas.forEach(v => {
            html += `
                <tr>
                    <td>${v.propiedad || "-"}</td>
                    <td>${v.cuarto || "-"}</td>
                    <td>${v.cliente || "-"}</td>
                    <td>${v.fecha_entrada || "-"}</td>
                    <td>${v.fecha_salida || "-"}</td>
                    <td>$${v.total || "0.00"}</td>
                </tr>`;
        });

        html += "</tbody></table>";
        ventasDiv.innerHTML = html;

    } catch (err) {
        ventasDiv.innerHTML = "<p class='text-danger'>Error cargando ventas.</p>";
        console.error("Error en fetch:", err);
    }
});
