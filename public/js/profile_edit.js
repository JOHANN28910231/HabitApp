document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    const result = document.getElementById('result');

    // Intentar obtener usuario actual para prellenar el formulario
    (async function prefill() {
        try {
            const r = await fetch('/api/auth/me', { credentials: 'same-origin' });
            if (!r.ok) {
                result.textContent = 'No autenticado. Inicia sesión primero en /';
                return;
            }
            const d = await r.json();
            const user = d.user;
            if (!user) return;
            document.getElementById('userId').value = user.id;
            if (user.nombre_completo) document.getElementById('nombre').value = user.nombre_completo;
        } catch (err) {
            console.error('prefill error', err);
        }
    })();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        result.textContent = 'Enviando...';
        // Usar endpoint /api/users/me para que el servidor use req.user.id
        const nombre = document.getElementById('nombre').value;
        const fotoInput = document.getElementById('foto');

        const fd = new FormData();
        if (nombre) fd.append('nombre_completo', nombre);
        if (fotoInput && fotoInput.files && fotoInput.files.length > 0) fd.append('foto', fotoInput.files[0]);

        try {
            const res = await fetch('/api/users/me', {
                method: 'PUT',
                credentials: 'same-origin',
                body: fd
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                result.textContent = `Error ${res.status}: ${JSON.stringify(data)}`;
                return;
            }
            result.textContent = JSON.stringify(data, null, 2);
            alert('Perfil actualizado');
        } catch (err) {
            console.error(err);
            result.textContent = 'Error de red: ' + err.message;
        }
    });
});
