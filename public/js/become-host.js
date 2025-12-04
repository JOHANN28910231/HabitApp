// public/js/become-host.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('becomeHostForm');
    const emailInput = document.getElementById('email');
    const nombreInput = document.getElementById('nombre');
    const idFileInput = document.getElementById('idFile');
    const passwordInput = document.getElementById('password');
    const termsCheck = document.getElementById('termsCheck');
    const submitBtn = document.getElementById('submitBtn');

    // 1) Prefill con /api/auth/me
    (async function prefillUser() {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
            if (!res.ok) {
                alert('Debes iniciar sesión para convertirte en anfitrión.');
                window.location.href = '/login.html';
                return;
            }
            const data = await res.json().catch(() => ({}));
            const user = data.user || data;
            if (!user) return;
            if (emailInput) emailInput.value = user.email || '';
            if (nombreInput) nombreInput.value = user.nombre_completo || user.nombre || '';
        } catch (err) {
            console.error('Error obteniendo usuario actual', err);
            alert('No se pudo cargar tu información. Intenta de nuevo más tarde.');
        }
    })();

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();

        if (!idFileInput.files || idFileInput.files.length === 0) {
            alert('Por favor, sube tu identificación oficial.');
            return;
        }

        const password = (passwordInput.value || '').trim();
        if (!password) {
            alert('Debes escribir tu contraseña para confirmar el cambio.');
            return;
        }

        if (!termsCheck.checked) {
            alert('Debes confirmar que deseas convertirte en anfitrión.');
            return;
        }

        // 2) Confirmación final
        const ok = confirm('¿Estás seguro de convertirte en anfitrión? Tu cuenta actual seguirá siendo la misma, solo añadiremos el rol de anfitrión.');
        if (!ok) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando...';

        const fd = new FormData();
        fd.append('password', password);
        fd.append('idFile', idFileInput.files[0]);

        try {
            const res = await fetch('/api/users/me/become-host', {
                method: 'POST',
                credentials: 'same-origin',
                body: fd
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data && (data.error || data.message)
                    ? (data.error || data.message)
                    : 'No se pudo completar el cambio.';
                alert('Error: ' + msg);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Solicitar cambio a anfitrión';
                return;
            }

            alert('¡Listo! Ahora también eres anfitrión. Serás redirigido a tu panel de anfitrión.');
            window.location.href = '/host/host-dashboard.html';

        } catch (err) {
            console.error('become-host error', err);
            alert('Error de red al procesar la solicitud.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Solicitar cambio a anfitrión';
        }
    });
});
