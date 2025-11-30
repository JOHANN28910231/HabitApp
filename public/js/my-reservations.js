// public/js/my-reservations.js
document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('reservationsTable');
    const tbody = document.getElementById('reservationsBody');
    const emptyAlert = document.getElementById('noReservations');

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    async function ensureAuth() {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!res.ok) {
            window.location.href = '/login.html';
            return null;
        }
        const data = await res.json().catch(() => ({}));
        return data.user || data;
    }

    function computeStatus(reserva) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(reserva.fecha_inicio);
        const end = new Date(reserva.fecha_salida);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (reserva.estado_reserva === 'cancelado') {
            return { code: 'cancelado', label: 'Cancelada', className: 'badge bg-secondary' };
        }

        if (today > end) {
            return { code: 'past', label: 'Finalizada', className: 'badge bg-danger' };
        }
        if (today < start) {
            return { code: 'upcoming', label: 'Próxima', className: 'badge bg-warning text-dark' };
        }
        return { code: 'ongoing', label: 'En curso', className: 'badge bg-success' };
    }

    function canCancel(reserva) {
        if (reserva.estado_reserva === 'cancelado') return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(reserva.fecha_inicio);
        start.setHours(0, 0, 0, 0);

        const diffDays = Math.round((start - today) / MS_PER_DAY);

        return diffDays > 0; // solo antes del día de inicio
    }

    function refundPreviewText(reserva) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(reserva.fecha_inicio);
        start.setHours(0, 0, 0, 0);

        const diffDays = Math.round((start - today) / MS_PER_DAY);

        if (diffDays >= 7) {
            return 'Al cancelar ahora se te devolverá el 50% de tu pago (si ya está aprobado).';
        }
        return 'Podrás cancelar, pero no aplica reembolso porque faltan menos de 7 días.';
    }

    async function cancelReservation(reserva) {
        const preview = refundPreviewText(reserva);
        const ok = confirm(`¿Seguro que deseas cancelar esta reservación?\n\n${preview}`);
        if (!ok) return;

        try {
            const res = await fetch(`/api/reservations/${encodeURIComponent(reserva.id_reservacion)}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data.error || 'No se pudo cancelar la reservación.');
                return;
            }

            alert(data.message || 'Reservación cancelada correctamente.');
            await loadReservations();
        } catch (err) {
            console.error(err);
            alert('Error de red al cancelar la reservación.');
        }
    }

    async function loadReservations() {
        const user = await ensureAuth();
        if (!user) return;

        try {
            const res = await fetch('/api/reservations/mine', {
                credentials: 'same-origin',
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error || 'No se pudieron cargar tus reservaciones');
                return;
            }

            const list = await res.json();

            if (!Array.isArray(list) || list.length === 0) {
                if (table) table.classList.add('d-none');
                if (emptyAlert) emptyAlert.classList.remove('d-none');
                return;
            }

            // Orden cronológico por fecha de inicio
            list.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

            if (emptyAlert) emptyAlert.classList.add('d-none');
            if (table) table.classList.remove('d-none');
            if (!tbody) return;

            tbody.innerHTML = '';

            list.forEach((r) => {
                const start = new Date(r.fecha_inicio);
                const end = new Date(r.fecha_salida);

                const status = computeStatus(r);

                const montoBase = (r.monto_pagado != null ? Number(r.monto_pagado) : Number(r.monto_total)) || 0;
                const montoFormatted = `$${montoBase.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;

                const periodo = `${start.toLocaleDateString('es-MX')} → ${end.toLocaleDateString('es-MX')}`;
                const ubicacion = `${r.municipio || ''}${r.municipio && r.estado ? ', ' : ''}${r.estado || ''}`;

                const tr = document.createElement('tr');

                tr.innerHTML = `
          <td>${r.id_reservacion}</td>
          <td>${r.folio_pago || '-'}</td>
          <td>${montoFormatted}</td>
          <td>${periodo}</td>
          <td>${ubicacion || '-'}</td>
          <td><span class="${status.className}">${status.label}</span></td>
          <td class="text-end"></td>
        `;

                const actionsTd = tr.querySelector('td.text-end');

                if (canCancel(r)) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'btn btn-sm btn-outline-danger';
                    btn.textContent = 'Cancelar';
                    btn.addEventListener('click', () => cancelReservation(r));
                    actionsTd.appendChild(btn);
                } else {
                    actionsTd.textContent = r.estado_reserva === 'cancelado'
                        ? '—'
                        : 'No cancelable';
                    actionsTd.classList.add('text-muted');
                }

                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            alert('Error de red al cargar tus reservaciones');
        }
    }

    loadReservations();
});
