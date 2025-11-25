document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    const result = document.getElementById('result'); // puede ser null; evitar escribir en UI directamente

    // Intentar obtener usuario actual para prellenar el formulario
    (async function prefill() {
        try {
            const r = await fetch('/api/auth/me', { credentials: 'same-origin' });
            if (!r.ok) {
                // No mostrar error crudo en la UI; redirigir al login
                console.warn('No autenticado. Redirigiendo a /login.html');
                window.location.href = '/login.html';
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

    // Helper to enable/disable form fields
    function setFormEditable(editable) {
        const fields = form.querySelectorAll('input, select, textarea, button');
        fields.forEach(f => {
            // keep logout and any non-form-action buttons enabled
            if (f.id === 'logoutBtn' || f.id === 'backBtn') return;
            // allow the edit button to be clickable when not editable
            if (f.dataset.editor === 'toggle') return;
            if (f.type === 'submit') return;
            try {
                // Always keep the email field disabled (cannot be edited here)
                if (f.id === 'email') {
                    f.disabled = true;
                    return;
                }
                f.disabled = !editable;
            } catch (e) { }
        });
    }

    // Transform the submit button into an edit-toggle by default
    const submitBtn = form.querySelector('button[type="submit"]');
    let wasEditing = false;
    if (submitBtn) {
        // create an edit button behavior: initially disabled fields, button says 'Editar perfil'
        submitBtn.type = 'button';
        submitBtn.textContent = 'Editar perfil';
        submitBtn.classList.remove('btn-accent');
        submitBtn.classList.add('btn-accent');
        submitBtn.dataset.editor = 'toggle';

        submitBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            if (!wasEditing) {
                // enable fields and turn this into submit
                setFormEditable(true);
                submitBtn.textContent = 'Actualizar perfil';
                submitBtn.type = 'submit';
                wasEditing = true;
                // focus first editable field
                const first = form.querySelector('input:not([disabled]), select:not([disabled])');
                if (first) first.focus();
            }
        });
    }

    // Initially make form not editable (locked view)
    try { setFormEditable(false); } catch (e) { console.warn('Could not set form editable state', e); }

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
                // Redirect to login page after successful logout
                window.location.href = '/login.html';
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
        // password field removed from profile edit UI; only include if present
        const passwordEl = document.getElementById('password');
        const password = passwordEl ? passwordEl.value : '';
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
        // Do not append email: email is not editable from this form and should not be changed here
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
            // despues de confirmar cambios, bloquear el formulario nuevamente y restaurar el botón
            try {
                setFormEditable(false);
                if (submitBtn) {
                    submitBtn.type = 'button';
                    submitBtn.textContent = 'Editar perfil';
                    wasEditing = false;
                }
            } catch (e) { console.warn('Could not re-lock form after save', e); }
        } catch (err) {
            console.error(err);
            alert('Error de red al actualizar perfil: ' + err.message);
        }
    });
});
