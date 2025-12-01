// public/js/reviews.js

document.addEventListener('DOMContentLoaded', () => {
    // Año actual en el footer
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    const reviewModeSection = document.getElementById('review-mode');
    const noTokenModeSection = document.getElementById('no-token-mode');

    if (token) {
        // MODO DEJAR RESEÑA (con token válido)
        if (reviewModeSection) reviewModeSection.classList.remove('hidden');
        if (noTokenModeSection) noTokenModeSection.classList.add('hidden');
        initReviewMode(token);
    } else {
        // MODO SIN TOKEN (acceso no autorizado)
        if (reviewModeSection) reviewModeSection.classList.add('hidden');
        if (noTokenModeSection) noTokenModeSection.classList.remove('hidden');
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
            errorBox.textContent = '❌ No se proporcionó un token válido.';
            errorBox.classList.remove('hidden');
        }
        return;
    }

    try {
        const res = await fetch(`/api/reviews/from-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
            if (errorBox) {
                errorBox.textContent = data.error || '❌ El enlace es inválido o ha expirado. Por favor, contacta con soporte si crees que esto es un error.';
                errorBox.classList.remove('hidden');
            }
            return;
        }

        // Mostrar info de la estancia si viene
        if (data.reserva && tokenInfoSection && tokenInfoText) {
            tokenInfoSection.classList.remove('hidden');
            const r = data.reserva;
            tokenInfoText.innerHTML = 
                `<strong>✓ Reservación verificada</strong><br>` +
                `Reservación #${r.id_reservacion} - Propiedad ${r.id_propiedad}, Habitación ${r.id_habitacion}`;
        }

        // Token válido: habilitar formulario
        if (form) {
            form.classList.remove('hidden');
            setupStarRating();
            setupCharCounter();
            form.addEventListener('submit', makeOnSubmitHandler(token));
        }
    } catch (err) {
        console.error(err);
        if (errorBox) {
            errorBox.textContent = '❌ Error al validar el token. Por favor, intenta de nuevo más tarde.';
            errorBox.classList.remove('hidden');
        }
    }
}

// Configurar sistema de calificación por estrellas
function setupStarRating() {
    const starContainer = document.getElementById('starRating');
    const ratingInput = document.getElementById('rating');
    
    if (!starContainer || !ratingInput) return;
    
    const stars = starContainer.querySelectorAll('span');
    
    stars.forEach((star) => {
        // Hover effect
        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.getAttribute('data-value'));
            highlightStars(stars, value);
        });
        
        // Click to select
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            ratingInput.value = value;
            selectStars(stars, value);
        });
    });
    
    // Reset al salir del contenedor
    starContainer.addEventListener('mouseleave', () => {
        const currentValue = parseInt(ratingInput.value) || 0;
        selectStars(stars, currentValue);
    });
}

function highlightStars(stars, count) {
    stars.forEach((star, index) => {
        if (index < count) {
            star.classList.add('hover');
        } else {
            star.classList.remove('hover');
        }
    });
}

function selectStars(stars, count) {
    stars.forEach((star, index) => {
        star.classList.remove('hover');
        if (index < count) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Configurar contador de caracteres
function setupCharCounter() {
    const textarea = document.getElementById('comentario');
    const charCount = document.getElementById('charCount');
    
    if (!textarea || !charCount) return;
    
    textarea.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
    });
}

function makeOnSubmitHandler(token) {
    return async function onSubmit(e) {
        e.preventDefault();

        const ratingEl = document.getElementById('rating');
        const tituloEl = document.getElementById('titulo');
        const comentarioEl = document.getElementById('comentario');
        const submitBtn = document.getElementById('submitBtn');
        const errorBox = document.getElementById('errorBox');

        // Validar calificación
        const rating = Number(ratingEl?.value);
        if (!rating || rating < 1 || rating > 5) {
            if (errorBox) {
                errorBox.textContent = '⚠️ Por favor selecciona una calificación de 1 a 5 estrellas.';
                errorBox.classList.remove('hidden');
            }
            return;
        }

        const body = {
            token,
            rating,
            titulo: tituloEl?.value.trim(),
            comentario: comentarioEl?.value.trim(),
        };

        // Validación adicional
        if (!body.titulo || !body.comentario) {
            if (errorBox) {
                errorBox.textContent = '⚠️ Por favor completa todos los campos del formulario.';
                errorBox.classList.remove('hidden');
            }
            return;
        }

        // Deshabilitar botón durante el envío
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }

        if (errorBox) {
            errorBox.classList.add('hidden');
        }

        try {
            const resp = await fetch('/api/reviews/from-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const out = await resp.json();

            if (!resp.ok) {
                if (errorBox) {
                    errorBox.textContent = '❌ ' + (out.error || 'Error al guardar la reseña. Intenta de nuevo.');
                    errorBox.classList.remove('hidden');
                }
                return;
            }

            // Éxito - Mostrar mensaje y redirigir
            document.querySelector('.reviews-page-card').innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                    <h2 style="color: var(--brand-color); margin-bottom: 16px; font-size: 26px;">¡Gracias por tu reseña!</h2>
                    <p style="color: var(--muted); font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                        Tu opinión ha sido registrada exitosamente y será muy útil para otros viajeros.
                    </p>
                    <a href="/" class="review-submit-btn" style="display: inline-block; text-decoration: none; width: auto; padding: 14px 32px;">
                        Volver al inicio
                    </a>
                </div>
            `;

            // Redirigir después de 3 segundos
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);

        } catch (err) {
            console.error(err);
            if (errorBox) {
                errorBox.textContent = '❌ Error de conexión. Por favor verifica tu internet e intenta de nuevo.';
                errorBox.classList.remove('hidden');
            }
        } finally {
            // Rehabilitar botón
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar mi reseña';
            }
        }
    };
}

/* ============================================
   Helpers y utilidades
   ============================================ */

// Formatear fecha para mostrar en formato legible
function formatValue(value) {
    if (value == null) return '';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        const date = new Date(value);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    return String(value);
}
