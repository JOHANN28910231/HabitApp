// public/js/reviews.js

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    const reviewModeSection = document.getElementById('review-mode');
    const viewModeSection = document.getElementById('view-mode');

    if (token) {
        // MODO DEJAR RESEÑA (con token)
        if (reviewModeSection) reviewModeSection.classList.remove('hidden');
        if (viewModeSection) viewModeSection.classList.add('hidden');
        initReviewMode(token);
    } else {
        // MODO SOLO LECTURA (sin token)
        if (reviewModeSection) reviewModeSection.classList.add('hidden');
        if (viewModeSection) viewModeSection.classList.remove('hidden');
        initViewMode();
    }
});

/* =========================
   MODO TOKEN: Dejar reseña
   ========================= */

async function initReviewMode(token) {
    const form = document.getElementById('reviewForm');
    const errorBox = document.getElementById('errorBox');
    const tokenInfoSection = document.getElementById('tokenInfoSection');
    const tokenInfoText = document.getElementById('tokenInfoText');

    if (!token) {
        if (errorBox) {
            errorBox.textContent = 'Token no proporcionado.';
            errorBox.classList.remove('d-none');
        }
        return;
    }

    try {
        const res = await fetch(`/api/reviews/from-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
            if (errorBox) {
                errorBox.textContent = data.error || 'Token inválido o expirado.';
                errorBox.classList.remove('d-none');
            }
            return;
        }

        // Mostrar info de la estancia si viene
        if (data.reserva && tokenInfoSection && tokenInfoText) {
            tokenInfoSection.classList.remove('d-none');
            const r = data.reserva;
            tokenInfoText.textContent =
                `Estancia finalizada (reservación #${r.id_reservacion}) ` +
                `en la propiedad ${r.id_propiedad}, habitación ${r.id_habitacion}.`;
        }

        // Token válido: habilitar formulario
        if (form) {
            form.classList.remove('d-none');
            form.addEventListener('submit', makeOnSubmitHandler(token));
        }
    } catch (err) {
        console.error(err);
        if (errorBox) {
            errorBox.textContent = 'Error al validar el token.';
            errorBox.classList.remove('d-none');
        }
    }
}

function makeOnSubmitHandler(token) {
    return async function onSubmit(e) {
        e.preventDefault();

        const ratingEl = document.getElementById('rating');
        const tituloEl = document.getElementById('titulo');
        const comentarioEl = document.getElementById('comentario');

        const body = {
            token,
            rating: Number(ratingEl?.value),
            titulo: tituloEl?.value,
            comentario: comentarioEl?.value,
        };

        try {
            const resp = await fetch('/api/reviews/from-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const out = await resp.json();

            if (!resp.ok) {
                alert(out.error || 'Error al guardar la reseña');
                return;
            }

            alert('¡Gracias por tu reseña!');
            window.location.href = '/';
        } catch (err) {
            console.error(err);
            alert('Error de red al enviar tu reseña.');
        }
    };
}

/* ============================================
   MODO SIN TOKEN: Ver reseñas por propiedad
   ============================================ */

function initViewMode() {
    const statusEl = document.getElementById('status');
    const resultsEl = document.getElementById('results');

    if (!resultsEl) return;

    // Cargar todas las reseñas al entrar en la vista (comportamiento solicitado)
    // Muestra la tabla completa agrupada por habitación.
    loadAllReviews({ statusEl, resultsEl, loadBtn: null });
}

async function loadReviewsByProperty(propertyId, { statusEl, resultsEl, loadBtn }) {
    clearStatus(statusEl);
    setStatus(statusEl, `Cargando reseñas de la propiedad ${propertyId}...`, 'neutral');
    setLoading(loadBtn, true);
    resultsEl.innerHTML = '';

    try {
        const resp = await fetch(`/api/reviews/property/${encodeURIComponent(propertyId)}`);
        if (!resp.ok) {
            throw new Error(`Error HTTP ${resp.status}`);
        }

        const data = await resp.json();

        if (!Array.isArray(data) || data.length === 0) {
            setStatus(statusEl, 'No se encontraron reseñas para esta propiedad.', 'ok');
            resultsEl.innerHTML =
                '<p class="empty-message">No hay reseñas registradas para esta propiedad.</p>';
            return;
        }

        // Agrupar por id_habitacion
        const grouped = {};
        for (const review of data) {
            const roomId = review.id_habitacion ?? 'Sin habitación';
            if (!grouped[roomId]) {
                grouped[roomId] = [];
            }
            grouped[roomId].push(review);
        }

        renderGroupedTables(grouped, resultsEl);
        setStatus(statusEl,
            `Se encontraron ${data.length} reseña(s) para la propiedad ${propertyId}.`,
            'ok'
        );
    } catch (err) {
        console.error(err);
        setStatus(statusEl, 'Ocurrió un error al cargar las reseñas. Revisa la consola.', 'error');
        resultsEl.innerHTML = '<p class="empty-message">Error al obtener las reseñas.</p>';
    } finally {
        setLoading(loadBtn, false);
    }
}

// Cargar todas las reseñas (nueva función)
async function loadAllReviews({ statusEl, resultsEl, loadBtn }) {
    clearStatus(statusEl);
    setStatus(statusEl, `Cargando todas las reseñas...`, 'neutral');
    setLoading(loadBtn, true);
    resultsEl.innerHTML = '';

    try {
        const resp = await fetch(`/api/reviews/all`);
        if (!resp.ok) {
            throw new Error(`Error HTTP ${resp.status}`);
        }

        const data = await resp.json();

        if (!Array.isArray(data) || data.length === 0) {
            setStatus(statusEl, 'No se encontraron reseñas.', 'ok');
            resultsEl.innerHTML = '<p class="empty-message">No hay reseñas registradas.</p>';
            return;
        }

        // Agrupar por id_habitacion
        const grouped = {};
        for (const review of data) {
            const roomId = review.id_habitacion ?? 'Sin habitación';
            if (!grouped[roomId]) grouped[roomId] = [];
            grouped[roomId].push(review);
        }

        renderGroupedTables(grouped, resultsEl);
        setStatus(statusEl, `Se encontraron ${data.length} reseña(s).`, 'ok');
    } catch (err) {
        console.error(err);
        setStatus(statusEl, 'Ocurrió un error al cargar las reseñas. Revisa la consola.', 'error');
        resultsEl.innerHTML = '<p class="empty-message">Error al obtener las reseñas.</p>';
    } finally {
        setLoading(loadBtn, false);
    }
}

function renderGroupedTables(groupedReviews, resultsEl) {
    resultsEl.innerHTML = '';
    const roomIds = Object.keys(groupedReviews);

    roomIds.forEach((roomId) => {
        const reviews = groupedReviews[roomId];

        const roomTitle = document.createElement('h3');
        roomTitle.className = 'room-title';
        roomTitle.textContent =
            roomId === 'Sin habitación'
                ? 'Sin habitación asociada'
                : `Habitación ${roomId}`;
        resultsEl.appendChild(roomTitle);

        if (!reviews.length) {
            const p = document.createElement('p');
            p.className = 'empty-message';
            p.textContent = 'No hay reseñas para esta habitación.';
            resultsEl.appendChild(p);
            return;
        }

        // columnas dinámicas basadas en el primer objeto
        const columns = Object.keys(reviews[0]);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        columns.forEach((col) => {
            const th = document.createElement('th');
            th.textContent = col;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        reviews.forEach((review) => {
            const tr = document.createElement('tr');
            columns.forEach((col) => {
                const td = document.createElement('td');
                const value = review[col];
                td.textContent = formatValue(value);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        resultsEl.appendChild(table);
    });
}

/* Helpers modo vista */

function formatValue(value) {
    if (value == null) return '';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        // Convertir ISO 8601 (2025-11-26T14:32:43.000Z) a DD/MM/YYYY HH:mm:ss
        const date = new Date(value);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
    return String(value);
}

function setStatus(statusEl, message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'reviews-status';
    if (type === 'error') statusEl.classList.add('reviews-status--error');
    if (type === 'ok') statusEl.classList.add('reviews-status--ok');
}

function clearStatus(statusEl) {
    if (!statusEl) return;
    statusEl.textContent = '';
    statusEl.className = 'reviews-status';
}

function setLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
}
