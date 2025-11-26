// public/js/reviews.js

const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const form = document.getElementById('reviewForm');
const errorBox = document.getElementById('errorBox');
const tokenInfoSection = document.getElementById('tokenInfoSection');
const tokenInfoText = document.getElementById('tokenInfoText');

async function init() {
    if (!token) {
        errorBox.textContent = 'Token no proporcionado.';
        errorBox.classList.remove('d-none');
        return;
    }

    try {
        const res = await fetch(`/api/reviews/from-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
            errorBox.textContent = data.error || 'Token inválido o expirado.';
            errorBox.classList.remove('d-none');
            return;
        }

        // Si quieres mostrar info de la estancia
        if (data.reserva && tokenInfoSection && tokenInfoText) {
            tokenInfoSection.classList.remove('d-none');
            const r = data.reserva;
            tokenInfoText.textContent =
                `Estancia finalizada (reservación #${r.id_reservacion}) ` +
                `en la propiedad ${r.id_propiedad}, habitación ${r.id_habitacion}.`;
        }

        // Token válido: habilitar formulario
        form.classList.remove('d-none');

        form.addEventListener('submit', onSubmit);
    } catch (err) {
        console.error(err);
        errorBox.textContent = 'Error al validar el token.';
        errorBox.classList.remove('d-none');
    }
}

async function onSubmit(e) {
    e.preventDefault();

    const body = {
        token,
        rating: Number(document.getElementById('rating').value),
        titulo: document.getElementById('titulo').value,
        comentario: document.getElementById('comentario').value,
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
        // Opcional: redirigir a inicio o cerrar
        window.location.href = '/';
    } catch (err) {
        console.error(err);
        alert('Error de red al enviar tu reseña.');
    }
}

init();
