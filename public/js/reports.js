// reports.js -> llamadas a /api/reports

async function genSalesReport(period, from, to) {
    const q = new URLSearchParams({ period, from, to });
    const res = await fetch(`/api/reports/sales?${q.toString()}`);
    const data = await res.json();
    return data;
}

async function downloadPdf(period, from, to) {
    const q = new URLSearchParams({ period, from, to });
    window.open(`/api/reports/sales/pdf?${q.toString()}`, '_blank');
}

// host-panel.html hooks
if (window.location.pathname.includes('/host/host-dashboard.html') || window.location.pathname.endsWith('/host-dashboard.html')) {
    document.getElementById('btnGenReport').addEventListener('click', async () => {
        const from = document.getElementById('rFrom').value;
        const to = document.getElementById('rTo').value;
        const period = document.getElementById('rPeriod').value;
        if (!from || !to) return alert('Selecciona rango');
        const data = await genSalesReport(period, from, to);
        const container = document.getElementById('reportResult');
        container.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    });

    document.getElementById('btnPdf').addEventListener('click', () => {
        const from = document.getElementById('rFrom').value;
        const to = document.getElementById('rTo').value;
        const period = document.getElementById('rPeriod').value;
        if (!from || !to) return alert('Selecciona rango');
        downloadPdf(period, from, to);
    });
}
