// Client-side registration handler
// Intercepts the form submit to send a JSON POST to /api/auth/register
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('regForm');
    const idUpload = document.getElementById('idUpload');
    const fileInput = document.getElementById('idFile');
    const fileInfo = document.getElementById('fileInfo');

    // Toggle ID upload visibility when role changes
    form.addEventListener('change', (e) => {
        if (e.target && e.target.name === 'role') {
            const val = form.role.value;
            if (val === 'host') {
                idUpload.classList.remove('hidden');
                idUpload.removeAttribute('aria-hidden');
            } else {
                idUpload.classList.add('hidden');
                idUpload.setAttribute('aria-hidden', 'true');
            }
        }
    });

    // Show selected filename
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                fileInfo.textContent = fileInput.files[0].name;
            } else {
                fileInfo.textContent = '';
            }
        });
    }

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const name = (form.name && form.name.value || '').trim();
        const email = (form.email && form.email.value || '').trim();
        const password = (form.password && form.password.value) || '';
        let role = form.role && form.role.value ? form.role.value : 'guest';

        // Map frontend role values to backend expected roles
        if (role === 'host') role = 'anfitrion';
        else if (role === 'guest') role = 'huesped';

        // Basic client-side validation
        if (!name || !email || !password) {
            alert('Completa nombre, correo y contraseña.');
            return;
        }

        // Note: file upload endpoint not implemented; we ignore files for now
        const body = { nombre: name, email, password, role };

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(body),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = data && data.error ? data.error : (data.message || 'Error en el registro');
                alert('Registro falló: ' + msg);
                return;
            }

            // Success - show message and redirect to login
            alert('Registro correcto. Serás redirigido a inicio de sesión.');
            window.location.href = '/';

        } catch (err) {
            console.error('Register error', err);
            alert('No se pudo completar el registro. Revisa la consola.');
        }
    });
});
