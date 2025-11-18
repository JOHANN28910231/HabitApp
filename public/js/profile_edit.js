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
            document.getElementById('userId').value = user.id || user.id_usuario || '';
            if (user.nombre_completo) document.getElementById('nombre').value = user.nombre_completo;
            if (user.telefono) document.getElementById('telefono').value = user.telefono;
            if (user.nacionalidad) document.getElementById('nacionalidad').value = user.nacionalidad;
            if (user.genero) document.getElementById('genero').value = user.genero;
            if (user.municipio) document.getElementById('municipio').value = user.municipio;
            if (user.estado) document.getElementById('estado').value = user.estado;
            if (user.fecha_nacimiento) {
                // fecha_nacimiento puede venir en formato ISO; convertir a yyyy-mm-dd
                const dobj = new Date(user.fecha_nacimiento);
                if (!isNaN(dobj.getTime())) {
                    const yyyy = dobj.getFullYear();
                    const mm = String(dobj.getMonth() + 1).padStart(2, '0');
                    const dd = String(dobj.getDate()).padStart(2, '0');
                    document.getElementById('fecha_nacimiento').value = `${yyyy}-${mm}-${dd}`;
                }
            }
            if (user.foto_url) {
                const p = document.getElementById('fotoPreview');
                p.innerHTML = `<img src="${user.foto_url}" alt="foto" style="max-width:120px;max-height:120px;border-radius:50%;">`;
            }
        } catch (err) {
            console.error('prefill error', err);
        }
    })();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        result.textContent = 'Enviando...';
        // Usar endpoint /api/users/me para que el servidor use req.user.id
        const nombre = document.getElementById('nombre').value;
        const telefono = document.getElementById('telefono').value;
        const nacionalidad = document.getElementById('nacionalidad').value;
        const genero = document.getElementById('genero').value;
        const municipio = document.getElementById('municipio').value;
        const estado = document.getElementById('estado').value;
        const fecha_nacimiento = document.getElementById('fecha_nacimiento').value;
        const password = document.getElementById('password').value;
        const fotoInput = document.getElementById('foto');

        const fd = new FormData();
        if (nombre) fd.append('nombre_completo', nombre);
        if (telefono) fd.append('telefono', telefono);
        if (nacionalidad) fd.append('nacionalidad', nacionalidad);
        if (genero) fd.append('genero', genero);
        if (municipio) fd.append('municipio', municipio);
        if (estado) fd.append('estado', estado);
        if (fecha_nacimiento) fd.append('fecha_nacimiento', fecha_nacimiento);
        if (password) fd.append('password', password);
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
