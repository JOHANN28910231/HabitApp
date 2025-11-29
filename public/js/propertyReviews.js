// public/js/propertyReviews.js

document.addEventListener('DOMContentLoaded', async () => {
    const section = document.getElementById('propertyReviewsSection');
    if (!section) return;

    const idProp = section.dataset.propertyId;
    const list = document.getElementById('propertyReviewsList');
    const emptyMsg = document.getElementById('propertyReviewsEmpty');

    if (!idProp || !list) return;

    try {
        const res = await fetch(`/api/reviews/property/${idProp}`);
        const reviews = await res.json();

        if (!Array.isArray(reviews) || reviews.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';

        reviews.forEach((r) => {
            const card = document.createElement('article');
            card.className = 'card rounded-4 p-3 mb-2';

            const stars = '⭐'.repeat(r.rating || 0);

            card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-1">
          <div class="fw-semibold">${stars}</div>
          <small class="text-muted">${r.nombre_completo || 'Huésped'}</small>
        </div>
        <div class="fw-bold mb-1">${r.titulo || '(Sin título)'}</div>
        <p class="mb-0">${r.comentario || ''}</p>
      `;

            list.appendChild(card);
        });
    } catch (err) {
        console.error('Error cargando reseñas de propiedad', err);
        if (emptyMsg) {
            emptyMsg.textContent = 'Error al cargar reseñas.';
            emptyMsg.style.display = 'block';
        }
    }
});
