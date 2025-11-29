// reports.js — funcional para reportes por periodo y rango
document.addEventListener("DOMContentLoaded", () => {
    // Forzar hostId de prueba solo si no hay uno en el DOM
//const testHostId = 4;
//window.hostId = testHostId;

    if (!hostId) return;

    // ----- ELEMENTOS POR PERIODO -----
    const pPeriod = document.getElementById("pPeriod");
    const pYear = document.getElementById("pYear");
    const pMonth = document.getElementById("pMonth");
    const monthContainer = document.getElementById("monthContainer");
    const btnGenPeriod = document.getElementById("btnGenPeriod");
    const btnPdfPeriod = document.getElementById("btnPdfPeriod");
    const reportResultPeriod = document.getElementById("reportResultPeriod");
    const reportSummaryPeriod = document.getElementById("reportSummaryPeriod");

    // ----- ELEMENTOS POR RANGO -----
    const rFrom = document.getElementById("rFrom");
    const rTo = document.getElementById("rTo");
    const btnGenRange = document.getElementById("btnGenRange");
    const btnPdfRange = document.getElementById("btnPdfRange");
    const reportResultRange = document.getElementById("reportResultRange");
    const reportSummaryRange = document.getElementById("reportSummaryRange");

    // ---- Cargar años dinámicamente ----
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 5; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        pYear.appendChild(option);
    }

    // ---- Mostrar/ocultar mes según periodo ----
    pPeriod.addEventListener("change", () => {
        monthContainer.style.display = pPeriod.value === "monthly" ? "block" : "none";
    });
    monthContainer.style.display = pPeriod.value === "monthly" ? "block" : "none";

    // ---- FUNCIONES AUX ----
    function formatCurrency(value) {
        return `$${parseFloat(value || 0).toFixed(2)}`;
    }

    function renderTable(container, rows) {
        if (!rows || rows.length === 0) {
            container.innerHTML = "<p class='text-muted'>No se encontraron resultados.</p>";
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
        rows.forEach(v => {
            // formatear fecha de pago a solo fecha
            const pagoFecha = v.fecha_pago ? new Date(v.fecha_pago).toLocaleDateString('es-MX') : '-';
            const estado = (v.estado_pago || '').toLowerCase();
            const estadoBadge = estado === 'aprobado'
                ? `<span class="badge bg-success">Aprobado</span>`
                : `<span class="badge bg-danger">${(v.estado_pago || 'rechazado')}</span>`;

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
                </tr>
            `;
        });
        html += "</tbody></table>";
        container.innerHTML = html;
    }

    function renderSummary(container, rows) {
        const total = rows.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
        container.classList.remove("d-none");
        container.innerHTML = `<p><strong>Total ventas:</strong> ${formatCurrency(total)}</p>`;
    }

    // ---- GENERAR REPORTE POR PERIODO ----
    btnGenPeriod.addEventListener("click", async () => {
        const year = pYear.value;
        const month = pPeriod.value === "monthly" ? pMonth.value : null;

        if (!year) {
            alert("Seleccione un año.");
            return;
        }

        try {
            const params = new URLSearchParams({ year });
            if (month) params.append("month", month);

            const res = await fetch(`/api/host/${hostId}/ventas/periodo?${params.toString()}`);
            const data = await res.json();

            renderTable(reportResultPeriod, data);
            renderSummary(reportSummaryPeriod, data);

        } catch (err) {
            console.error(err);
            reportResultPeriod.innerHTML = "<p class='text-danger'>Error cargando reporte.</p>";
        }
    });

    // ---- DESCARGAR PDF POR PERIODO ----
    btnPdfPeriod.addEventListener("click", async () => {
        const year = pYear.value;
        const month = pPeriod.value === "monthly" ? pMonth.value : null;

        if (!year) {
            alert("Seleccione un año.");
            return;
        }

        try {
            const params = new URLSearchParams({ year });
            if (month) params.append("month", month);

            const res = await fetch(`/api/host/${hostId}/ventas/periodo/pdf?${params.toString()}`);
            if (!res.ok) throw new Error("Error generando PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `reporte_periodo_${year}${month ? "_" + month : ""}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Error generando PDF");
        }
    });

    // ---- GENERAR REPORTE POR RANGO ----
    btnGenRange.addEventListener("click", async () => {
        const from = rFrom.value;
        const to = rTo.value;

        if (!from || !to) {
            alert("Debe indicar fechas desde y hasta");
            return;
        }

        try {
            const params = new URLSearchParams({ from, to });
            const res = await fetch(`/api/host/${hostId}/ventas/rango?${params.toString()}`);
            const data = await res.json();

            renderTable(reportResultRange, data);
            renderSummary(reportSummaryRange, data);

        } catch (err) {
            console.error(err);
            reportResultRange.innerHTML = "<p class='text-danger'>Error cargando reporte.</p>";
        }
    });

    // ---- DESCARGAR PDF POR RANGO ----
    btnPdfRange.addEventListener("click", async () => {
        const from = rFrom.value;
        const to = rTo.value;

        if (!from || !to) {
            alert("Debe indicar fechas desde y hasta");
            return;
        }

        try {
            const params = new URLSearchParams({ from, to });
            const res = await fetch(`/api/host/${hostId}/ventas/rango/pdf?${params.toString()}`);
            if (!res.ok) throw new Error("Error generando PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `reporte_rango_${from}_a_${to}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Error generando PDF");
        }
    });
});
