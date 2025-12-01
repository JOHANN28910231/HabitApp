// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const destinoInput       = document.getElementById('destino');
    const llegadaInput       = document.getElementById('llegada');
    const salidaInput        = document.getElementById('salida');
    const huespedesInput     = document.getElementById('huespedes');
    const searchForm         = document.getElementById('searchForm');
    const suggestionsBox     = document.getElementById('destinoSuggestions');
    const resultsContainer   = document.getElementById('searchResults');
    const resultsSection     = document.getElementById('resultsSection');

    // Elementos del modal de reservación
    const resModalEl         = document.getElementById('reservationModal');
    const resPropName        = document.getElementById('resPropName');
    const resLocation        = document.getElementById('resLocation');
    const resRoomDesc        = document.getElementById('resRoomDesc');
    const resServices        = document.getElementById('resServices'); // NUEVO
    const resDates           = document.getElementById('resDates');
    const resGuests          = document.getElementById('resGuests');
    const resTotal           = document.getElementById('resTotal');
    const resTipoAlojamiento = document.getElementById('resTipoAlojamiento');
    const resError           = document.getElementById('resError');
    const resConfirmBtn      = document.getElementById('resConfirmBtn');

    if (!searchForm) return;

    let lastSearch = { destino: '', from: '', to: '', guests: 1 };
    let currentRoom = null;
    let resModalInstance = null;

    // Instancia del modal de Bootstrap (si existe)
    if (resModalEl && window.bootstrap && window.bootstrap.Modal) {
        resModalInstance = new bootstrap.Modal(resModalEl);
    }

    // ============================
    // 1) Fechas mínimas y reglas
    // ============================
    const todayISO = new Date().toISOString().slice(0, 10);
    if (llegadaInput) llegadaInput.min = todayISO;
    if (salidaInput)  salidaInput.min  = todayISO;

    llegadaInput?.addEventListener('change', () => {
        if (!llegadaInput.value) return;
        const d = new Date(llegadaInput.value);
        d.setDate(d.getDate() + 1);
        const minSalida = d.toISOString().slice(0, 10);
        salidaInput.min = minSalida;
        if (salidaInput.value && salidaInput.value < minSalida) {
            salidaInput.value = minSalida;
        }
    });

    // =====================================
    // 2) Autocomplete de destinos
    // =====================================
    let destTimeout = null;

    function clearSuggestions() {
        if (suggestionsBox) {
            suggestionsBox.innerHTML = '';
        }
    }

    destinoInput?.addEventListener('input', () => {
        const q = destinoInput.value.trim();
        clearSuggestions();
        if (q.length < 2) return;

        if (destTimeout) clearTimeout(destTimeout);
        destTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/availability/destinos/sugerencias?q=${encodeURIComponent(q)}`, {
                    credentials: 'same-origin',
                });
                if (!res.ok) return;
                const data = await res.json();
                renderSuggestions(data || []);
            } catch (err) {
                console.warn('Error obteniendo sugerencias', err);
            }
        }, 250);
    });

    function renderSuggestions(items) {
        clearSuggestions();
        if (!items.length) return;
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'list-group-item list-group-item-action';
            btn.textContent = item.etiqueta || `${item.municipio}, ${item.estado}`;
            btn.addEventListener('click', () => {
                destinoInput.value = btn.textContent;
                clearSuggestions();
            });
            suggestionsBox.appendChild(btn);
        });
    }

    document.addEventListener('click', (e) => {
        if (suggestionsBox && !suggestionsBox.contains(e.target) && e.target !== destinoInput) {
            clearSuggestions();
        }
    });

    // =====================================
    // 3) Envío del formulario de búsqueda
    // =====================================
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const destino = destinoInput.value.trim();
        const from    = llegadaInput.value;
        const to      = salidaInput.value;
        const guests  = parseInt(huespedesInput.value || '1', 10);

        if (!from || !to) {
            alert('Selecciona fechas de llegada y salida');
            return;
        }
        const dFrom = new Date(from);
        const dTo   = new Date(to);
        const diffDays = (dTo - dFrom) / (1000 * 60 * 60 * 24);
        if (isNaN(diffDays) || diffDays < 1) {
            alert('La salida debe ser al menos un día después de la llegada (mínimo 1 noche).');
            return;
        }
        if (guests < 1) {
            alert('El número de huéspedes debe ser al menos 1.');
            return;
        }

        lastSearch = { destino, from, to, guests };

        try {
            const params = new URLSearchParams({
                destino,
                from,
                to,
                guests: String(guests),
            });

            const res = await fetch(`/api/availability/search?${params.toString()}`, {
                credentials: 'same-origin',
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Error en la búsqueda');
                return;
            }

            renderResults(data.resultados || []);
        } catch (err) {
            console.error(err);
            alert('Error de red al buscar alojamientos');
        }
    });

    // =====================================
    // Helpers para tipo de alojamiento
    // =====================================
    function calcNights(from, to) {
        const dFrom = new Date(from);
        const dTo   = new Date(to);
        const diff  = (dTo - dFrom) / (1000 * 60 * 60 * 24);
        return isNaN(diff) ? 0 : diff;
    }

    function calcEstimatedTotal(room, tipo, from, to) {
        const nights = calcNights(from, to);
        if (!nights || nights <= 0) return null;

        const pn = Number(room.precio_por_noche || 0);
        const pw = Number(room.precio_por_semana || 0);
        const pm = Number(room.precio_por_mes || 0);

        if (tipo === 'semana' && pw > 0) {
            const weeks    = Math.floor(nights / 7);
            const extra    = nights % 7;
            const dailyW   = pw / 7;
            return weeks * pw + extra * dailyW;
        }

        if (tipo === 'mes' && pm > 0) {
            const daysPerMonth = 30;
            const months  = Math.floor(nights / daysPerMonth);
            const extra   = nights % daysPerMonth;
            const dailyM  = pm / daysPerMonth;
            return months * pm + extra * dailyM;
        }

        // Por defecto, por noche
        if (pn > 0) {
            return pn * nights;
        }

        return null;
    }

    function setupTipoAlojamientoOptions(room, from, to) {
        if (!resTipoAlojamiento) return;

        const nights = calcNights(from, to);

        // Limpiar opciones
        resTipoAlojamiento.innerHTML = '';

        // Siempre existe "por noche"
        const optNoche = document.createElement('option');
        optNoche.value = 'noche';
        optNoche.textContent = 'Por noche';
        resTipoAlojamiento.appendChild(optNoche);

        if (nights >= 7) {
            const optSemana = document.createElement('option');
            optSemana.value = 'semana';
            optSemana.textContent = 'Por semana';
            resTipoAlojamiento.appendChild(optSemana);
        }

        if (nights >= 30) {
            const optMes = document.createElement('option');
            optMes.value = 'mes';
            optMes.textContent = 'Por mes';
            resTipoAlojamiento.appendChild(optMes);
        }

        // Primera opción seleccionada
        resTipoAlojamiento.value = resTipoAlojamiento.options[0].value;

        // Actualizar el total mostrado
        const total = calcEstimatedTotal(room, resTipoAlojamiento.value, from, to);
        if (resTotal) {
            resTotal.textContent = total
                ? `$${total.toLocaleString()} MXN (aprox.)`
                : 'Se calculará al confirmar';
        }

        // Evitar múltiples listeners
        resTipoAlojamiento.onchange = () => {
            const selectedTipo = resTipoAlojamiento.value;
            const newTotal = calcEstimatedTotal(room, selectedTipo, from, to);
            if (resTotal) {
                resTotal.textContent = newTotal
                    ? `$${newTotal.toLocaleString()} MXN (aprox.)`
                    : 'Se calculará al confirmar';
            }
        };
    }

    // =====================================
    // 4) Abrir modal de reservación
    // =====================================
    function openReservationModal(room) {
        if (!resModalInstance) {
            alert('No se pudo abrir el modal de reservación.');
            return;
        }

        currentRoom = room;

        if (resError) {
            resError.textContent = '';
            resError.classList.add('d-none');
        }

        if (resPropName)  resPropName.textContent = room.nombre_propiedad || 'Propiedad';
        if (resLocation)  resLocation.textContent = `${room.municipio || ''}, ${room.estado || ''}`;
        if (resRoomDesc)  resRoomDesc.textContent = room.habitacion_descripcion || room.descripcion || 'Habitación disponible';

        // Servicios: usar lo que viene de searchAvailableRooms (campo servicios)
        if (resServices) {
            if (room.servicios && room.servicios.trim()) {
                // room.servicios viene como string "Wifi, Cocina, Estacionamiento"
                resServices.textContent = 'Servicios: ' + room.servicios;
            } else {
                resServices.textContent = 'Servicios: No especificados.';
            }
        }


        const { from, to, guests } = lastSearch;
        if (resDates)   resDates.textContent  = (from && to) ? `${from} → ${to}` : '—';
        if (resGuests)  resGuests.textContent = guests || 1;

        // Configurar opciones de tipo de alojamiento según número de noches
        if (from && to) {
            setupTipoAlojamientoOptions(room, from, to);
        } else if (resTotal) {
            resTotal.textContent = 'Se calculará al confirmar';
        }

        // Cargar reseñas de la habitación
        loadRoomReviews(room.id_habitacion);

        resModalInstance.show();
    }

    // =====================================
    // 4.1) Cargar y mostrar reseñas de la habitación
    // =====================================
    async function loadRoomReviews(idHabitacion) {
        const reviewsContainer = document.getElementById('roomReviews');
        if (!reviewsContainer) return;

        // Mostrar estado de carga
        reviewsContainer.innerHTML = '<p class="text-muted small text-center mb-0">Cargando reseñas...</p>';

        try {
            const res = await fetch(`/api/reviews/room/${idHabitacion}`);
            if (!res.ok) {
                throw new Error(`Error HTTP ${res.status}`);
            }

            const reviews = await res.json();

            if (!Array.isArray(reviews) || reviews.length === 0) {
                reviewsContainer.innerHTML = '<p class="text-muted small text-center mb-0 fst-italic">Aún no hay reseñas para esta habitación.</p>';
                return;
            }

            // Renderizar reseñas
            let html = '';
            reviews.forEach((review, index) => {
                const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
                const fecha = formatReviewDate(review.fecha);
                const nombre = review.nombre_completo || 'Huésped';

                html += `
                    <div class="border-bottom pb-2 mb-2 ${index === reviews.length - 1 ? 'border-0 pb-0 mb-0' : ''}">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <strong class="small">${escapeHtml(review.titulo || 'Sin título')}</strong>
                            <span class="text-warning small">${stars}</span>
                        </div>
                        <p class="small mb-1 text-muted">${escapeHtml(review.comentario || '')}</p>
                        <div class="d-flex justify-content-between">
                            <small class="text-muted">${escapeHtml(nombre)}</small>
                            <small class="text-muted">${fecha}</small>
                        </div>
                    </div>
                `;
            });

            reviewsContainer.innerHTML = html;

        } catch (err) {
            console.error('Error cargando reseñas:', err);
            reviewsContainer.innerHTML = '<p class="text-danger small text-center mb-0">Error al cargar reseñas.</p>';
        }
    }

    // Helper: formatear fecha de reseña
    function formatReviewDate(dateString) {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return '—';
        }
    }

    // Helper: escapar HTML para prevenir XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =====================================
    // 5) Confirmar reservación (POST /api/reservations)
    // =====================================
    if (resConfirmBtn) {
        resConfirmBtn.addEventListener('click', async () => {
            if (!currentRoom) return;

            const { from, to } = lastSearch;
            if (!from || !to) {
                if (resError) {
                    resError.textContent = 'Faltan las fechas de la reservación.';
                    resError.classList.remove('d-none');
                }
                return;
            }

            const tipo = resTipoAlojamiento ? resTipoAlojamiento.value : 'noche';

            try {
                const body = {
                    id_habitacion  : currentRoom.id_habitacion,
                    fecha_inicio   : from,
                    fecha_salida   : to,
                    tipo_alojamiento: tipo,
                };

                const res = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(body),
                });

                const data = await res.json().catch(() => ({}));

                // Manejo especial de 401
                if (res.status === 401) {
                    try {
                        const meRes = await fetch('/api/auth/me', {
                            credentials: 'same-origin',
                        });

                        if (meRes.ok) {
                            if (resError) {
                                resError.textContent = data.error || 'No tienes permiso para realizar esta reservación.';
                                resError.classList.remove('d-none');
                            }
                            return;
                        }
                    } catch (e) {
                        console.warn('Error verificando sesión en /api/auth/me', e);
                    }

                    if (resError) {
                        resError.textContent = 'Debes iniciar sesión para reservar. Te redirigiremos al inicio de sesión.';
                        resError.classList.remove('d-none');
                    }
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1500);
                    return;
                }

                if (!res.ok) {
                    if (resError) {
                        resError.textContent = data.error || 'No se pudo crear la reservación.';
                        resError.classList.remove('d-none');
                    }
                    return;
                }

                // ÉXITO: redirigir a checkout con id_reservacion y monto_total
                const reservationId = data.id_reservacion;
                const amount        = data.monto_total || 0;

                if (!reservationId) {
                    alert('Reservación creada, pero no se recibió el ID. Contacta al administrador.');
                    return;
                }

                window.location.href =
                    `/payment/checkout.html?reservationId=${encodeURIComponent(reservationId)}` +
                    `&amount=${encodeURIComponent(amount)}`;

            } catch (err) {
                console.error(err);
                if (resError) {
                    resError.textContent = 'Error de red al crear la reservación.';
                    resError.classList.remove('d-none');
                }
            }
        });
    }

    // =====================================
    // 6) Pintar resultados
    // =====================================
    function renderResults(list) {
        if (!resultsContainer) return;

        if (resultsSection) {
            resultsSection.classList.remove('d-none');
        }

        if (!list.length) {
            resultsContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning">
            No se encontraron alojamientos disponibles para las fechas indicadas.
          </div>
        </div>`;
            return;
        }

        resultsContainer.innerHTML = '';
        list.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-4';

            const precioNoche = item.precio_por_noche
                ? `$${Number(item.precio_por_noche).toLocaleString()} / noche`
                : 'Consulta precios';

            // Aseguramos una URL válida para la imagen
            let imgSrc = item.foto_principal && item.foto_principal.trim()
                ? item.foto_principal.trim()
                : '/fotosPropiedades/placeholder.jpg';

            // Si por algún motivo no empieza con "/" (por cambios futuros), se lo agregamos
            if (!imgSrc.startsWith('/') && !/^https?:\/\//i.test(imgSrc)) {
                imgSrc = '/' + imgSrc;
            }

            const imgHtml = `
            <img src="${imgSrc}" class="card-img-top" alt="Foto de la habitación">
        `;

            col.innerHTML = `
        <div class="card rounded-4 shadow-sm h-100">
          ${imgHtml}
          <div class="card-body d-flex flex-column">
            <h5 class="card-title mb-1">${item.nombre_propiedad}</h5>
            <p class="mb-1 text-muted small">${item.municipio}, ${item.estado}</p>
            <p class="mb-2 small">${item.habitacion_descripcion || 'Habitación disponible'}</p>
            <p class="fw-semibold mb-2">${precioNoche}</p>
            <p class="text-muted small mb-3">Capacidad: ${item.capacidad_maxima} huésped(es)</p>
            <div class="mt-auto">
              <button 
                type="button"
                class="btn btn-sm btn-accent w-100 btn-reservar"
                data-room-id="${item.id_habitacion}">
                Ver detalles y reservar
              </button>
            </div>
          </div>
        </div>
        `;
            resultsContainer.appendChild(col);
        });

        const buttons = resultsContainer.querySelectorAll('.btn-reservar');
        buttons.forEach(btn => {
            const roomId = Number(btn.dataset.roomId);
            const room = list.find(r => Number(r.id_habitacion) === roomId);
            if (!room) return;

            btn.addEventListener('click', () => openReservationModal(room));
        });
    }
});
