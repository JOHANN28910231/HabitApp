// public/js/admin-edit-room.js

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    const propId = params.get('property');

    const titleEl = document.getElementById('pageTitle');
    const statusBox = document.getElementById('statusBox');
    const form = document.getElementById('roomForm');

    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (document.referrer) {
                history.back();
            } else {
                window.location.href = '/admin/admin-dashboard.html';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
            } catch {}
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '/login.html';
        });
    }

    if (!roomId) {
        if (statusBox) {
            statusBox.classList.remove('text-muted');
            statusBox.classList.add('text-danger');
            statusBox.textContent = 'ID de habitación no especificado en la URL.';
        }
        return;
    }

    if (titleEl) {
        titleEl.textContent = `Editar habitación #${roomId}`;
    }

    // ======= Cargar datos de la habitación =======
    async function loadRoom() {
        try {
            const res = await fetch(`/api/admin/habitaciones/${roomId}`, {
                credentials: 'same-origin',
            });
            if (!res.ok) {
                throw new Error('No se pudo cargar la habitación.');
            }
            const room = await res.json();

            // Se ocupan los nombres de los atributos de la tabla habitacion
            document.getElementById('descripcion').value = room.descripcion || '';
            document.getElementById('capacidad_maxima').value = room.capacidad_maxima || 1;
            if (room.estado_habitacion) {
                document.getElementById('estado_habitacion').value = room.estado_habitacion;
            }
            if (room.precio_por_noche != null) {
                document.getElementById('precio_por_noche').value = room.precio_por_noche;
            }
            if (room.precio_por_semana != null) {
                document.getElementById('precio_por_semana').value = room.precio_por_semana;
            }
            if (room.precio_por_mes != null) {
                document.getElementById('precio_por_mes').value = room.precio_por_mes;
            }

            if (statusBox) {
                statusBox.textContent = `Editando habitación de la propiedad ${propId || ''}`.trim();
            }
        } catch (err) {
            console.error(err);
            if (statusBox) {
                statusBox.classList.remove('text-muted');
                statusBox.classList.add('text-danger');
                statusBox.textContent = 'Error al cargar la habitación. Revisa la consola.';
            }
        }
    }

    // ======= Guardar cambios =======
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const body = {
                descripcion: document.getElementById('descripcion').value.trim(),
                capacidad_maxima: Number(document.getElementById('capacidad_maxima').value || 1),
                precio_por_noche: document.getElementById('precio_por_noche').value || null,
                precio_por_semana: document.getElementById('precio_por_semana').value || null,
                precio_por_mes: document.getElementById('precio_por_mes').value || null,
                estado_habitacion: document.getElementById('estado_habitacion').value || null,
            };

            try {
                const res = await fetch(`/api/admin/habitaciones/${roomId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(body),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    alert('No se pudo guardar la habitación: ' + (data.error || res.status));
                    return;
                }

                alert('Habitación actualizada correctamente.');
                // Después de guardar, se regresa al dashboard:
                if (document.referrer) {
                    history.back();
                } else {
                    window.location.href = '/admin/admin-dashboard.html';
                }
            } catch (err) {
                console.error(err);
                alert('Error de red al guardar la habitación.');
            }
        });
    }

    loadRoom();
});
