document.addEventListener('DOMContentLoaded', () => {
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

    // Manejo del botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Intentar garantizar que showAppModal esté disponible (cargar dinámicamente si no)
            async function ensureAppModal() {
                if (typeof window.showAppModal === 'function') return true;
                return new Promise((resolve) => {
                    const s = document.createElement('script');
                    s.src = '/js/app-modal.js';
                    s.onload = () => resolve(typeof window.showAppModal === 'function');
                    s.onerror = () => resolve(false);
                    document.head.appendChild(s);
                    // Timeout de seguridad
                    setTimeout(() => resolve(typeof window.showAppModal === 'function'), 800);
                });
            }

            let confirmed = false;
            try {
                const hasModal = await ensureAppModal();
                if (hasModal) {
                    confirmed = await window.showAppModal({
                        title: 'Confirmar sesión',
                        message: '¿Deseas cerrar sesión?',
                        okText: 'Cerrar sesión',
                        cancelText: 'Cancelar'
                    });
                } else {
                    confirmed = confirm('¿Deseas cerrar sesión?');
                }
            } catch (err) {
                console.error('logout modal error', err);
                confirmed = confirm('¿Deseas cerrar sesión?');
            }

            if (!confirmed) return;

            try {
                const res = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    alert(err.error || 'No se pudo cerrar sesión');
                    return;
                }
                // After logout, redirect to login page
                window.location.href = '/login.html';
            } catch (err) {
                console.error('logout error', err);
                alert('Error al cerrar sesión');
            }
        });
    }
});
