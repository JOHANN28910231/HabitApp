const hostNameEl = document.getElementById('hostName');
if (hostNameEl) {
    hostNameEl.textContent = sessionStorage.getItem('user_name') || 'Anfitrión';
}

const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Obtener host_id correctamente
window.hostId = Number(sessionStorage.getItem('host_id'));

if (!window.hostId) {
    console.warn("⚠ No hay host_id en sessionStorage. El usuario no es anfitrión o no se guardó bien.");
}
