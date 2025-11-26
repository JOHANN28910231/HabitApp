// Client-side registration handler
// Intercepts the form submit to send a JSON POST to /api/auth/register
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('regForm');
    const idUpload = document.getElementById('idUpload');
    const fileInput = document.getElementById('idFile');
    const fileInfo = document.getElementById('fileInfo');
    const roleFieldset = document.getElementById('roleFieldset');

    // If page was opened with ?role=host, force host role and hide role radios
    try {
        const params = new URLSearchParams(window.location.search);
        const forced = params.get('role');
        if (forced && forced.toLowerCase() === 'host') {
            // set radio value if present
            if (form.role) {
                try { form.role.value = 'host'; } catch (e) { /* ignore */ }
            }
            // hide the role fieldset so the user doesn't change it
            if (roleFieldset) {
                roleFieldset.classList.add('hidden');
                roleFieldset.setAttribute('aria-hidden', 'true');
            }
            // show ID upload section for hosts (keep behavior consistent)
            if (idUpload) {
                idUpload.classList.remove('hidden');
                idUpload.removeAttribute('aria-hidden');
            }
        }
    } catch (err) {
        console.warn('Could not parse role param', err);
    }

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
        const nombre = (form.nombre && form.nombre.value || '').trim();
        const email = (form.email && form.email.value || '').trim();
        const password = (form.password && form.password.value) || '';
        const password2 = (form.password2 && form.password2.value) || '';
        const telefono = (form.telefono && form.telefono.value || '').trim();
        const nacionalidad = (form.nacionalidad && form.nacionalidad.value || '').trim();
        const genero = (form.genero && form.genero.value || '').trim();
        const municipio = (form.municipio && form.municipio.value || '').trim();
        const estado = (form.estado && form.estado.value || '').trim();
        const fecha_nacimiento = (form.fecha_nacimiento && form.fecha_nacimiento.value) || '';
        let role = form.role && form.role.value ? form.role.value : 'guest';

        // Map frontend role values to backend expected roles
        if (role === 'host') role = 'anfitrion';
        else if (role === 'guest') role = 'huesped';

        // Basic client-side validation
        const emailRe = /^\S+@\S+\.\S+$/;
        if (!nombre) return alert('Ingresa tu nombre completo.');
        if (!email || !emailRe.test(email)) return alert('Ingresa un correo válido.');
        if (!password || password.length < 8) return alert('La contraseña debe tener al menos 8 caracteres.');
        if (!password2) return alert('Confirma la contraseña.');
        if (password !== password2) return alert('Las contraseñas no coinciden.');
        if (!telefono) return alert('Ingresa un teléfono.');
        if (!nacionalidad) return alert('Ingresa tu nacionalidad.');
        if (!genero) return alert('Selecciona tu género.');
        if (!municipio) return alert('Ingresa tu municipio o ciudad.');
        if (!estado) return alert('Ingresa tu estado o región.');
        if (!fecha_nacimiento) return alert('Indica tu fecha de nacimiento.');

        const body = { nombre, email, password, telefono, nacionalidad, genero, municipio, estado, fecha_nacimiento, role };

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(body),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = data && (data.error || data.message) ? (data.error || data.message) : 'Error en el registro';
                alert('Registro falló: ' + msg);
                return;
            }

            // Success - show message and redirect to login
            alert('Registro correcto. Serás redirigido a la página de inicio de sesión.');
            window.location.href = '/login.html';

        } catch (err) {
            console.error('Register error', err);
            alert('No se pudo completar el registro. Revisa la consola.');
        }
    });
});
