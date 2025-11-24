document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    const result = document.getElementById('result'); // puede ser null; evitar escribir en UI directamente

    // Intentar obtener usuario actual para prellenar el formulario
    (async function prefill() {
        try {
            const r = await fetch('/api/auth/me', { credentials: 'same-origin' });
            if (!r.ok) {
                // No mostrar error crudo en la UI; redirigir al inicio para login
                console.warn('No autenticado. Redirigiendo a /');
                window.location.href = '/';
                return;
            }
            const d = await r.json();
            const user = d.user;
            if (!user) return;
            document.getElementById('userId').value = user.id || user.id_usuario || '';
            if (user.nombre_completo) document.getElementById('nombre').value = user.nombre_completo;
            if (user.email) document.getElementById('email').value = user.email;
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
                const headerAvatar = document.getElementById('headerAvatar');
                if (headerAvatar) headerAvatar.innerHTML = `<img src="${user.foto_url}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
            if (user.nombre_completo) {
                const headerName = document.getElementById('headerName');
                if (headerName) headerName.textContent = user.nombre_completo;
            }
        } catch (err) {
            console.error('prefill error', err);
        }
    })();

    // Logout button handling (uses showAppModal if available)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            let confirmed = false;
            if (typeof window.showAppModal === 'function') {
                try {
                    confirmed = await window.showAppModal({
                        title: 'Cerrar sesión',
                        message: '¿Estás seguro de que quieres cerrar la sesión?',
                        okText: 'Aceptar',
                        cancelText: 'Cancelar'
                    });
                } catch (e) {
                    console.error('showAppModal error', e);
                    confirmed = false;
                }
            } else {
                confirmed = confirm('¿Estás seguro de que quieres cerrar la sesión?');
            }
            if (!confirmed) return;
            try {
                const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    alert(err.error || 'No se pudo cerrar sesión');
                    return;
                }
                window.location.href = '/';
            } catch (err) {
                console.error('logout error', err);
                alert('Error al cerrar sesión');
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Mostrar feedback en consola; usamos alert al terminar
        if (result) result.textContent = '';
        console.log('Enviando datos de perfil...');
        // Usar endpoint /api/users/me para que el servidor use req.user.id
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
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
        if (email) fd.append('email', email);
        if (fotoInput && fotoInput.files && fotoInput.files.length > 0) fd.append('foto', fotoInput.files[0]);

        try {
            const res = await fetch('/api/users/me', {
                method: 'PUT',
                credentials: 'same-origin',
                body: fd
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                console.error('Error actualizando perfil', res.status, data);
                alert('Error al actualizar perfil: ' + (data && data.error ? data.error : res.status));
                return;
            }
            console.log('Respuesta actualización:', data);
            // Si el servidor devolvió la URL de la foto, actualizar avatar del header y preview
            try {
                const u = data && (data.user || data);
                const foto = u && (u.foto_url || u.fotoUrl || (u.user && u.user.foto_url));
                const nombre = u && (u.nombre_completo || (u.user && u.user.nombre_completo));
                if (foto) {
                    const headerAvatar = document.getElementById('headerAvatar');
                    if (headerAvatar) {
                        const img = document.createElement('img');
                        img.src = foto;
                        img.alt = 'avatar';
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '50%';
                        img.style.opacity = '0';
                        img.style.transition = 'opacity 320ms ease';
                        headerAvatar.innerHTML = '';
                        headerAvatar.appendChild(img);
                        img.onload = () => { requestAnimationFrame(() => img.style.opacity = '1'); };
                    }
                }
                if (nombre) {
                    const headerName = document.getElementById('headerName');
                    if (headerName) headerName.textContent = nombre;
                }
            } catch (e) { console.error('update UI after save error', e); }
            alert('Perfil actualizado');
        } catch (err) {
            console.error(err);
            alert('Error de red al actualizar perfil: ' + err.message);
        }
    });
});
