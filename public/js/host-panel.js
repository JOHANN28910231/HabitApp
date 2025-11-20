const hostNameEl = document.getElementById('hostName');
if (hostNameEl) {
    hostNameEl.textContent = sessionStorage.getItem('user_name') || 'Anfitrión';
}

const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Nuevo: obtener el host_id
window.hostId = sessionStorage.getItem('host_id');
